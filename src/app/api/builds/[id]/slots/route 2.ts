import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Verify the build exists
    const build = await prisma.build.findUnique({ where: { id: buildId } });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    // If assigning an accessory (not removing), validate it
    if (accessoryId !== null && accessoryId !== undefined) {
      // Verify the accessory exists
      const accessory = await prisma.accessory.findUnique({
        where: { id: accessoryId },
      });
      if (!accessory) {
        return NextResponse.json(
          { error: "Accessory not found" },
          { status: 404 }
        );
      }

      // Check if this accessory is already assigned to another active slot
      // (across all builds, or more precisely in any slot that belongs to an active build)
      const existingSlot = await prisma.buildSlot.findFirst({
        where: {
          accessoryId,
          // Exclude the current slot being updated (same buildId + slotType)
          NOT: {
            AND: [{ buildId }, { slotType }],
          },
          build: {
            isActive: true,
          },
        },
        include: {
          build: {
            select: { id: true, name: true, firearmId: true },
          },
        },
      });

      if (existingSlot) {
        return NextResponse.json(
          {
            error: `This accessory is already assigned to an active build slot (Build: "${existingSlot.build.name}", Slot: ${existingSlot.slotType})`,
            conflictingSlot: {
              buildId: existingSlot.buildId,
              buildName: existingSlot.build.name,
              slotType: existingSlot.slotType,
            },
          },
          { status: 409 }
        );
      }
    }

    // Upsert the slot: create if not exists, update if exists
    const slot = await prisma.buildSlot.upsert({
      where: {
        buildId_slotType: { buildId, slotType },
      },
      create: {
        buildId,
        slotType,
        accessoryId: accessoryId ?? null,
      },
      update: {
        accessoryId: accessoryId ?? null,
      },
      include: {
        accessory: true,
      },
    });

    return NextResponse.json(slot);
  } catch (error) {
    console.error("PUT /api/builds/[id]/slots error:", error);
    return NextResponse.json(
      { error: "Failed to update slot" },
      { status: 500 }
    );
  }
}
