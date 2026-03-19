import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SLOT_TYPES } from "@/lib/types";

function isCustomSlotType(slotType: string): boolean {
  if (!slotType.startsWith("CUSTOM:")) return false;
  const rest = slotType.slice("CUSTOM:".length);
  const pipe = rest.indexOf("|");
  if (pipe !== -1) {
    return rest.slice(0, pipe).trim().length > 0 && rest.slice(pipe + 1).trim().length > 0;
  }
  return rest.trim().length > 0;
}

function parseCustomSlotType(slotType: string): { category: string | null; name: string } | null {
  if (!isCustomSlotType(slotType)) return null;
  const rest = slotType.slice("CUSTOM:".length);
  const pipe = rest.indexOf("|");
  if (pipe === -1) {
    return { category: null, name: rest.trim() };
  }

  const category = rest.slice(0, pipe).trim() || null;
  const name = rest.slice(pipe + 1).trim();
  if (!name) return null;

  return { category, name };
}

function buildCustomSlotType(category: string | null, name: string): string {
  return category ? `CUSTOM:${category}|${name}` : `CUSTOM:${name}`;
}

// PUT /api/builds/[id]/slots - Assign or remove an accessory from a slot
// Body: { slotType: string, accessoryId: string | null }
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

    if (!SLOT_TYPES.includes(slotType) && !isCustomSlotType(slotType)) {
      return NextResponse.json(
        {
          error: `Invalid slotType. Must be one of: ${SLOT_TYPES.join(", ")} or a custom slot in the form CUSTOM:Slot Name`,
        },
        { status: 400 }
      );
    }

    const build = await prisma.build.findUnique({ where: { id: buildId } });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

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
              {
                code: "CONFLICT",
                conflictingSlot: {
                  buildId: existingSlot.buildId,
                  buildName: existingSlot.build.name,
                  slotType: existingSlot.slotType,
                },
              }
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
        return NextResponse.json(
          { error: err.message, conflictingSlot: err.conflictingSlot },
          { status: 409 }
        );
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

// PATCH /api/builds/[id]/slots - Rename a custom slot
// Body: { slotType: string, newName: string, category?: string | null }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buildId } = await params;
    const body = await request.json();
    const slotType = typeof body.slotType === "string" ? body.slotType : "";
    const newName = typeof body.newName === "string" ? body.newName.trim() : "";

    if (!slotType || !newName) {
      return NextResponse.json(
        { error: "Missing required fields: slotType, newName" },
        { status: 400 }
      );
    }

    if (!isCustomSlotType(slotType)) {
      return NextResponse.json(
        { error: "Only custom slots can be renamed" },
        { status: 400 }
      );
    }

    const parsed = parseCustomSlotType(slotType);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid custom slot type" }, { status: 400 });
    }

    const categoryOverride =
      body.category === undefined
        ? parsed.category
        : typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : null;
    const newSlotType = buildCustomSlotType(categoryOverride, newName);

    const existingSlot = await prisma.buildSlot.findUnique({
      where: { buildId_slotType: { buildId, slotType } },
    });
    if (!existingSlot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (newSlotType === slotType) {
      return NextResponse.json(existingSlot);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const conflict = await tx.buildSlot.findUnique({
        where: { buildId_slotType: { buildId, slotType: newSlotType } },
      });
      if (conflict) {
        throw new Error("A slot with that name already exists in this build");
      }

      return tx.buildSlot.update({
        where: { id: existingSlot.id },
        data: { slotType: newSlotType },
        include: { accessory: true },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/builds/[id]/slots error:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to rename slot" }, { status: 500 });
  }
}

// DELETE /api/builds/[id]/slots?slotType=CUSTOM:... - Delete a custom slot record entirely
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
