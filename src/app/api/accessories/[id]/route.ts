import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/accessories/[id] - Get a single accessory with roundCountLogs and current buildSlots
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const accessory = await prisma.accessory.findUnique({
      where: { id },
      include: {
        roundCountLogs: {
          orderBy: { loggedAt: "desc" },
        },
        buildSlots: {
          include: {
            build: {
              select: {
                id: true,
                name: true,
                isActive: true,
                firearm: {
                  select: {
                    id: true,
                    name: true,
                    manufacturer: true,
                    model: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!accessory) {
      return NextResponse.json(
        { error: "Accessory not found" },
        { status: 404 }
      );
    }

    const activeSlot = accessory.buildSlots.find(
      (slot) => slot.build.isActive
    );

    return NextResponse.json({
      ...accessory,
      currentBuild: activeSlot
        ? {
            id: activeSlot.build.id,
            name: activeSlot.build.name,
            slotType: activeSlot.slotType,
            firearm: activeSlot.build.firearm,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/accessories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accessory" },
      { status: 500 }
    );
  }
}

// PUT /api/accessories/[id] - Update an accessory
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      manufacturer,
      model,
      type,
      caliber,
      purchasePrice,
      acquisitionDate,
      notes,
      imageUrl,
      imageSource,
      compatibleFirearmTypes,
      compatibleCalibers,
    } = body;

    const existing = await prisma.accessory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Accessory not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.accessory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(manufacturer !== undefined && { manufacturer }),
        ...(model !== undefined && { model }),
        ...(type !== undefined && { type }),
        ...(caliber !== undefined && { caliber }),
        ...(purchasePrice !== undefined && { purchasePrice }),
        ...(acquisitionDate !== undefined && {
          acquisitionDate: acquisitionDate
            ? (() => { const d = new Date(acquisitionDate); return isNaN(d.getTime()) ? null : d; })()
            : null,
        }),
        ...(notes !== undefined && { notes }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(imageSource !== undefined && { imageSource }),
        ...(compatibleFirearmTypes !== undefined && { compatibleFirearmTypes }),
        ...(compatibleCalibers !== undefined && { compatibleCalibers }),
      },
      include: {
        roundCountLogs: {
          orderBy: { loggedAt: "desc" },
          take: 10,
        },
        buildSlots: {
          include: {
            build: {
              select: {
                id: true,
                name: true,
                isActive: true,
                firearm: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/accessories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update accessory" },
      { status: 500 }
    );
  }
}

// DELETE /api/accessories/[id] - Delete an accessory
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.accessory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Accessory not found" },
        { status: 404 }
      );
    }

    await prisma.accessory.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/accessories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete accessory" },
      { status: 500 }
    );
  }
}
