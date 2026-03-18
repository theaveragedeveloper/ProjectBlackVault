import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";
import { parseJsonBody, RequestValidationError, validationErrorResponse } from "@/lib/validation/request";
import { dopeSchemas } from "@/lib/validation/schemas/api";

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
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;

    const card = await prisma.dopeCard.findUnique({
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
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await parseJsonBody(request, dopeSchemas.cardUpdate, { maxBytes: 256 * 1024 });

    const card = await prisma.dopeCard.update({
      where: { id },
      data: {
        firearmId:      body.firearmId,
        name:           body.name,
        notes:          body.notes,
        zeroDistanceYd: body.zeroRangeYd,
        unit:           body.unit,
        rows:           body.profile !== undefined ? JSON.stringify(body.profile) : undefined,
      },
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    if (error instanceof RequestValidationError) return validationErrorResponse(error);
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
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    await prisma.dopeCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Dope card not found" }, { status: 404 });
    }
    console.error("DELETE /api/dope-cards/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete dope card" }, { status: 500 });
  }
}
