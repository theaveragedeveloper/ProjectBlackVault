import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const toOptionalString = (value: unknown, maxLength: number) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return null;
  return value.slice(0, maxLength);
};

const toOptionalNumber = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

const toOptionalDate = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toOptionalObject = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === "object" && !Array.isArray(value) ? value : null;
};

// GET /api/dope-cards - List cards, optional ?firearmId= filter, optional ?limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const limitRaw = parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;

    const cards = await prisma.dopeCard.findMany({
      where: firearmId ? { firearmId } : undefined,
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("GET /api/dope-cards error:", error);
    return NextResponse.json({ error: "Failed to fetch dope cards" }, { status: 500 });
  }
}

// POST /api/dope-cards - Create a new dope card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firearmId, name, notes, zeroRangeYd, profile, unit } = body ?? {};

    if (!firearmId) {
      return NextResponse.json({ error: "Missing required field: firearmId" }, { status: 400 });
    }

    const card = await prisma.dopeCard.create({
      data: {
        firearmId,
        name: toOptionalString(name, 200) ?? "",
        notes: toOptionalString(notes, 5000),
        zeroDistanceYd: toOptionalNumber(zeroRangeYd) ?? 0,
        unit: toOptionalString(unit, 10) ?? "MOA",
        rows: typeof profile === "object" && profile !== null ? JSON.stringify(profile) : "[]",
      },
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("POST /api/dope-cards error:", error);
    return NextResponse.json({ error: "Failed to create dope card" }, { status: 500 });
  }
}
