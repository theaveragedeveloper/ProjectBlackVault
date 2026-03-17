import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";
import { parseJsonBody, RequestValidationError, validationErrorResponse } from "@/lib/validation/request";
import { dopeSchemas } from "@/lib/validation/schemas/api";

// GET /api/dope-cards - List cards, optional ?firearmId= filter, optional ?limit=
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

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
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const body = await parseJsonBody(request, dopeSchemas.card, { maxBytes: 256 * 1024 });

    const card = await prisma.dopeCard.create({
      data: {
        firearmId:      body.firearmId,
        name:           body.name,
        notes:          body.notes ?? null,
        zeroDistanceYd: body.zeroRangeYd,
        unit:           body.unit ?? "MOA",
        rows:           JSON.stringify(body.profile),
      },
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    if (error instanceof RequestValidationError) return validationErrorResponse(error);
    console.error("POST /api/dope-cards error:", error);
    return NextResponse.json({ error: "Failed to create dope card" }, { status: 500 });
  }
}
