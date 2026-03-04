import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

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
    const { firearmId, description, type, date, mileage } = body;

    if (!firearmId || !description) {
      return NextResponse.json(
        { error: "Missing required fields: firearmId, description" },
        { status: 400 }
      );
    }

    const note = await prisma.maintenanceNote.create({
      data: {
        firearmId,
        description,
        type: type || "other",
        date: date ? new Date(date) : new Date(),
        mileage: mileage ? parseInt(mileage) : null,
      },
      include: { firearm: { select: { id: true, name: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/maintenance-notes error:", error);
    return NextResponse.json({ error: "Failed to create maintenance note" }, { status: 500 });
  }
}
