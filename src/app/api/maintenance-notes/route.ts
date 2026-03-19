import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDateInput(value: unknown): Date | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const limitRaw = parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;

    const notes = await prisma.maintenanceNote.findMany({
      where: firearmId ? { firearmId } : undefined,
      include: { firearm: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET /api/maintenance-notes error:", error);
    return NextResponse.json({ error: "Failed to fetch maintenance notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firearmId, description, type, date, dueDate, mileage } = body;

    if (!firearmId || !description) {
      return NextResponse.json(
        { error: "Missing required fields: firearmId, description" },
        { status: 400 }
      );
    }

    const mileageInt = mileage !== undefined && mileage !== null
      ? parseInt(String(mileage), 10)
      : null;

    if (mileageInt !== null && !Number.isFinite(mileageInt)) {
      return NextResponse.json({ error: "mileage must be a valid integer" }, { status: 400 });
    }

    const parsedDate = parseDateInput(date);
    const parsedDueDate = parseDateInput(dueDate);

    if (parsedDate === "invalid") {
      return NextResponse.json({ error: "date must be a valid date" }, { status: 400 });
    }

    if (parsedDueDate === "invalid") {
      return NextResponse.json({ error: "dueDate must be a valid date" }, { status: 400 });
    }

    const note = await prisma.maintenanceNote.create({
      data: {
        firearmId,
        description: typeof description === "string" ? description.slice(0, 5000) : String(description),
        type: typeof type === "string" ? type.slice(0, 100) : "Other",
        date: parsedDate ?? new Date(),
        dueDate: parsedDueDate,
        mileage: mileageInt,
      },
      include: { firearm: { select: { id: true, name: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/maintenance-notes error:", error);
    return NextResponse.json({ error: "Failed to create maintenance note" }, { status: 500 });
  }
}
