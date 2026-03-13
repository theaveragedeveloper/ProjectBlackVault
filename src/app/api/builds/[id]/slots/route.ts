import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SLOT_TYPES } from "@/lib/types";

// PUT /api/builds/[id]/slots - Assign or remove an accessory from a slot
// Body: { slotType: string, accessoryId: string | null }
// Creates the slot if it doesn't exist for this build, updates if it does.
// When assigning an accessory, checks it's not already in another active slot.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buildId } = await params;
    const body = await request.json();
    const { slotType, accessoryId } = body;

    if (!slotType) {
      return NextResponse.json(
        { error: "Missing required field: slotType" },
        { status: 400 }
      );
    }

    if (!SLOT_TYPES.includes(slotType)) {
      return NextResponse.json(
        { error: `Invalid slotType. Must be one of: ${SLOT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify the build exists
    const build = await prisma.build.findUnique({ where: { id: buildId } });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    // If assigning an accessory (not removing), validate existence first (outside transaction — read-only, cheap)
    if (accessoryId !== null && accessoryId !== undefined) {
      const accessory = await prisma.accessory.findUnique({
        where: { id: accessoryId },
      });
      if (!accessory) {
        return NextResponse.json(
          { error: "Accessory not found" },
          { status: 404 }
        );
      }
    }

    // Wrap the conflict-check + upsert in a transaction so no concurrent request
    // can slip the same accessory into a second slot between the two operations.
    let slot;
    try {
      slot = await prisma.$transaction(async (tx) => {
        if (accessoryId !== null && accessoryId !== undefined) {
          const existingSlot = await tx.buildSlot.findFirst({
            where: {
              accessoryId,
              NOT: { AND: [{ buildId }, { slotType }] },
              build: { isActive: true },
            },
            include: {
              build: { select: { id: true, name: true, firearmId: true } },
            },
          });

          if (existingSlot) {
            throw Object.assign(
              new Error(`This accessory is already assigned to an active build slot (Build: "${existingSlot.build.name}", Slot: ${existingSlot.slotType})`),
              { code: "CONFLICT", conflictingSlot: { buildId: existingSlot.buildId, buildName: existingSlot.build.name, slotType: existingSlot.slotType } }
            );
          }
        }

        return tx.buildSlot.upsert({
          where: { buildId_slotType: { buildId, slotType } },
          create: { buildId, slotType, accessoryId: accessoryId ?? null },
          update: { accessoryId: accessoryId ?? null },
          include: { accessory: true },
        });
      });
    } catch (txError) {
      if ((txError as { code?: string }).code === "CONFLICT") {
        const err = txError as { message: string; conflictingSlot: unknown };
        return NextResponse.json({ error: err.message, conflictingSlot: err.conflictingSlot }, { status: 409 });
      }
      throw txError;
    }

    return NextResponse.json(slot);
  } catch (error) {
    console.error("PUT /api/builds/[id]/slots error:", error);
    return NextResponse.json(
      { error: "Failed to update slot" },
      { status: 500 }
    );
  }
}
