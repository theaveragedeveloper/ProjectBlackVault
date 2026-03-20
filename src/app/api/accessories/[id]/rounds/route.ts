import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardCaches } from "@/lib/server/dashboard";
import { requireAuth } from "@/lib/server/auth";

// POST /api/accessories/[id]/rounds - Log round count for an accessory
// Body: { rounds: number, note?: string }
// Updates accessory.roundCount and creates a RoundCountLog entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { rounds, note } = body;

    if (rounds === undefined || rounds === null) {
      return NextResponse.json(
        { error: "Missing required field: rounds" },
        { status: 400 }
      );
    }

    if (typeof rounds !== "number" || !Number.isInteger(rounds) || rounds <= 0 || rounds > 1_000_000) {
      return NextResponse.json(
        { error: "rounds must be a positive integer no greater than 1,000,000" },
        { status: 400 }
      );
    }

    const accessory = await prisma.accessory.findUnique({ where: { id } });
    if (!accessory) {
      return NextResponse.json(
        { error: "Accessory not found" },
        { status: 404 }
      );
    }

    const previousCount = accessory.roundCount;
    const newCount = Math.max(0, previousCount + rounds);

    // Use a transaction to atomically update roundCount and create the log
    const [updatedAccessory, log] = await prisma.$transaction([
      prisma.accessory.update({
        where: { id },
        data: { roundCount: newCount },
      }),
      prisma.roundCountLog.create({
        data: {
          accessoryId: id,
          roundsAdded: rounds,
          previousCount,
          newCount,
          sessionNote: note ?? null,
        },
      }),
    ]);

    revalidateDashboardCaches(["accessories"]);

    return NextResponse.json(
      {
        accessory: updatedAccessory,
        log,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/accessories/[id]/rounds error:", error);

    return NextResponse.json(
      { error: "Failed to log round count" },
      { status: 500 }
    );
  }
}
