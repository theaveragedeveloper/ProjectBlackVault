import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardData } from "@/lib/dashboard/revalidate-dashboard";

// GET /api/builds/[id] - Get a single build with slots and accessories populated
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const build = await prisma.build.findUnique({
      where: { id },
      include: {
        firearm: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            model: true,
            type: true,
            caliber: true,
            imageUrl: true,
          },
        },
        slots: {
          include: {
            accessory: true,
          },
        },
      },
    });

    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    return NextResponse.json(build);
  } catch (error) {
    console.error("GET /api/builds/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch build" },
      { status: 500 }
    );
  }
}

// PUT /api/builds/[id] - Update a build
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    const existing = await prisma.build.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    // If activating this build, deactivate others for same firearm
    if (isActive === true && !existing.isActive) {
      await prisma.build.updateMany({
        where: { firearmId: existing.firearmId, isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const updated = await prisma.build.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        firearm: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            model: true,
            type: true,
            caliber: true,
            imageUrl: true,
          },
        },
        slots: {
          include: {
            accessory: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/builds/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update build" },
      { status: 500 }
    );
  }
}

// DELETE /api/builds/[id] - Delete a build
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.build.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const deleteAccessories = body.deleteAccessories === true;

    // Wrap all mutations in a transaction so partial failures don't leave orphaned data
    await prisma.$transaction(async (tx) => {
      if (deleteAccessories) {
        const slots = await tx.buildSlot.findMany({
          where: { buildId: id, accessoryId: { not: null } },
          select: { accessoryId: true },
        });
        const accessoryIds = slots.map((s) => s.accessoryId).filter(Boolean) as string[];
        if (accessoryIds.length > 0) {
          await tx.accessory.deleteMany({ where: { id: { in: accessoryIds } } });
        }
      } else {
        await tx.buildSlot.updateMany({
          where: { buildId: id },
          data: { accessoryId: null },
        });
      }

      await tx.build.delete({ where: { id } });
    });

    revalidateDashboardData();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/builds/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete build" },
      { status: 500 }
    );
  }
}
