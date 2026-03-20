import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SLOT_TYPES } from "@/lib/types";
import { requireAuth } from "@/lib/server/auth";

function isCustomSlotType(slotType: string): boolean {
  if (!slotType.startsWith("CUSTOM:")) return false;
  const rest = slotType.slice("CUSTOM:".length);
  const pipe = rest.indexOf("|");
  if (pipe !== -1) {
    // New format: CUSTOM:<category>|<name>
    return rest.slice(0, pipe).trim().length > 0 && rest.slice(pipe + 1).trim().length > 0;
  }
  // Old format: CUSTOM:<name>
  return rest.trim().length > 0;
}

// PUT /api/builds/[id]/slots - Assign or remove an accessory from a slot
// Body: { slotType: string, accessoryId: string | null }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

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

    if (!SLOT_TYPES.includes(slotType) && !isCustomSlotType(slotType)) {
      return NextResponse.json(
        {
          error: `Invalid slotType. Must be one of: ${SLOT_TYPES.join(", ")} or a custom slot in the form CUSTOM:Slot Name`,
        },
        { status: 400 }
      );
    }

    if (slotType.length > 100) {
      return NextResponse.json(
        { error: "slotType must not exceed 100 characters" },
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

// DELETE /api/builds/[id]/slots?slotType=CUSTOM:... - Delete a custom slot record entirely
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id: buildId } = await params;
    const { searchParams } = new URL(request.url);
    const slotType = searchParams.get("slotType");

    if (!slotType) {
      return NextResponse.json({ error: "Missing required query param: slotType" }, { status: 400 });
    }

    if (!isCustomSlotType(slotType)) {
      return NextResponse.json({ error: "Only custom slots can be deleted" }, { status: 400 });
    }

    await prisma.buildSlot.deleteMany({ where: { buildId, slotType } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/builds/[id]/slots error:", error);
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 });
  }
}
