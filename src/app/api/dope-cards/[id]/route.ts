import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const prismaClient = prisma as unknown as {
  dopeCard: {
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
};

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

const isNotFoundError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string };
  return candidate.code === "P2025";
};

// GET /api/dope-cards/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const card = await prismaClient.dopeCard.findUnique({
      where: { id },
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Dope card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("GET /api/dope-cards/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch dope card" }, { status: 500 });
  }
}

// PUT /api/dope-cards/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { firearmId, name, notes, zeroRangeYd, profile, confirmedAt } = body ?? {};

    const card = await prismaClient.dopeCard.update({
      where: { id },
      data: {
        firearmId: firearmId !== undefined ? firearmId || null : undefined,
        name: toOptionalString(name, 200),
        notes: toOptionalString(notes, 5000),
        zeroRangeYd: toOptionalNumber(zeroRangeYd),
        profile: toOptionalObject(profile),
        confirmedAt: toOptionalDate(confirmedAt),
      },
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Dope card not found" }, { status: 404 });
    }
    console.error("PUT /api/dope-cards/[id] error:", error);
    return NextResponse.json({ error: "Failed to update dope card" }, { status: 500 });
  }
}

// DELETE /api/dope-cards/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prismaClient.dopeCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Dope card not found" }, { status: 404 });
    }
    console.error("DELETE /api/dope-cards/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete dope card" }, { status: 500 });
  }
}
