import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/builds/[id]/duplicate — Deep-copy a build and all its slots
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const source = await prisma.build.findUnique({
      where: { id },
      include: { slots: true },
    });

    if (!source) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    const newBuild = await prisma.build.create({
      data: {
        name: `${source.name} (copy)`,
        description: source.description,
        status: "in-progress",
        isActive: false,
        firearmId: source.firearmId,
        sortOrder: source.sortOrder,
      },
    });

    if (source.slots.length > 0) {
      await prisma.buildSlot.createMany({
        data: source.slots.map((slot) => ({
          buildId: newBuild.id,
          slotType: slot.slotType,
          accessoryId: slot.accessoryId,
          positionX: slot.positionX,
          positionY: slot.positionY,
          scaleX: slot.scaleX,
          scaleY: slot.scaleY,
          layerIndex: slot.layerIndex,
        })),
      });
    }

    return NextResponse.json({ build: newBuild }, { status: 201 });
  } catch (error) {
    console.error("POST /api/builds/[id]/duplicate error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate build" },
      { status: 500 }
    );
  }
}
