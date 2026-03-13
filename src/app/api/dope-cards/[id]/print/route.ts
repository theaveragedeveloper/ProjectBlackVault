import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const sanitizeJson = (value: unknown, depth = 0): JsonValue => {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (depth >= 6) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 500).map((item) => sanitizeJson(item, depth + 1));
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sanitized: JsonObject = {};
    for (const [key, item] of Object.entries(obj)) {
      if (key.toLowerCase().includes("password") || key.toLowerCase().includes("secret")) continue;
      sanitized[key] = sanitizeJson(item, depth + 1);
    }
    return sanitized;
  }

  return null;
};

// GET /api/dope-cards/[id]/print
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const card = (await prisma.dopeCard.findUnique({
      where: { id },
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
      },
    })) as {
      id: string;
      name: string | null;
      notes: string | null;
      zeroRangeYd: number | null;
      profile: unknown;
      firearm?: { id: string; name: string; caliber: string | null };
      updatedAt?: string | Date;
      confirmedAt?: string | Date | null;
    } | null;

    if (!card) {
      return NextResponse.json({ error: "Dope card not found" }, { status: 404 });
    }

    const printPayload = {
      id: card.id,
      title: card.name,
      notes: card.notes,
      zeroRangeYd: card.zeroRangeYd,
      confirmedAt: card.confirmedAt ?? null,
      updatedAt: card.updatedAt ?? null,
      firearm: card.firearm
        ? {
            id: card.firearm.id,
            name: card.firearm.name,
            caliber: card.firearm.caliber ?? null,
          }
        : null,
      profile: sanitizeJson(card.profile),
    };

    return NextResponse.json(printPayload);
  } catch (error) {
    console.error("GET /api/dope-cards/[id]/print error:", error);
    return NextResponse.json({ error: "Failed to generate print payload" }, { status: 500 });
  }
}
