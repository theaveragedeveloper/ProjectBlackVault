import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const selectedAccessoryIdsRaw: unknown[] = Array.isArray(body?.selectedAccessoryIds) ? body.selectedAccessoryIds : [];
    const selectedAccessoryIds = selectedAccessoryIdsRaw.filter(
      (value): value is string => typeof value === "string" && value.length > 0
    );

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.rangeSession.findUnique({
        where: { id },
        include: {
          ammoLinks: true,
          build: {
            include: {
              slots: {
                include: {
                  accessory: {
                    select: {
                      id: true,
                      roundCount: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Range session not found");
      }

      const sessionNote = `Range session ${session.id}`;

      for (const ammoLink of session.ammoLinks) {
        if (!ammoLink.ammoStockId) continue;

        const existing = await tx.ammoTransaction.findFirst({
          where: {
            stockId: ammoLink.ammoStockId,
            type: "RANGE_USE",
            note: sessionNote,
          },
          select: { id: true },
        });

        if (existing) continue;

        const stock = await tx.ammoStock.findUnique({ where: { id: ammoLink.ammoStockId } });
        if (!stock) {
          throw new Error("Ammo stock no longer exists for this session");
        }

        if (stock.quantity < ammoLink.roundsUsed) {
          throw new Error(`Insufficient ammo stock for ${stock.brand} (${stock.caliber})`);
        }

        const previousQty = stock.quantity;
        const newQty = previousQty - ammoLink.roundsUsed;

        await tx.ammoStock.update({
          where: { id: stock.id },
          data: { quantity: newQty },
        });

        await tx.ammoTransaction.create({
          data: {
            stockId: stock.id,
            type: "RANGE_USE",
            quantity: ammoLink.roundsUsed,
            previousQty,
            newQty,
            note: sessionNote,
          },
        });
      }

      const allowedAccessoryIds = new Set(
        (session.build?.slots ?? [])
          .map((slot) => slot.accessory?.id)
          .filter((accessoryId): accessoryId is string => Boolean(accessoryId))
      );

      const accessoryIdsToProcess = selectedAccessoryIds.length > 0
        ? selectedAccessoryIds.filter((accessoryId) => allowedAccessoryIds.has(accessoryId))
        : Array.from(allowedAccessoryIds);

      for (const accessoryId of accessoryIdsToProcess) {
        const alreadyLogged = await tx.roundCountLog.findFirst({
          where: {
            accessoryId,
            sessionNote,
          },
          select: { id: true },
        });

        if (alreadyLogged) continue;

        const accessory = await tx.accessory.findUnique({ where: { id: accessoryId } });
        if (!accessory) {
          continue;
        }

        const previousCount = accessory.roundCount;
        const newCount = previousCount + session.roundsFired;

        await tx.accessory.update({
          where: { id: accessoryId },
          data: { roundCount: newCount },
        });

        await tx.roundCountLog.create({
          data: {
            accessoryId,
            roundsAdded: session.roundsFired,
            previousCount,
            newCount,
            sessionNote,
          },
        });
      }

      return {
        sessionId: session.id,
        accessoriesProcessed: accessoryIdsToProcess.length,
        ammoLinksProcessed: session.ammoLinks.length,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Range session not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("POST /api/range/sessions/[id]/finalize error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to finalize session" }, { status: 400 });
  }
}
