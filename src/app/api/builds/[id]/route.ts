import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEntityWriteAccess } from "@/lib/server/entity-write-access";

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
    const entityAccess = await requireEntityWriteAccess(request, "build", id);
    if (!entityAccess.ok) {
      return entityAccess.response;
    }

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

    const entityAccess = await requireEntityWriteAccess(request, "build", id);
    if (!entityAccess.ok) {
      return entityAccess.response;
    }

    const existing = await prisma.build.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    await prisma.build.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/builds/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete build" },
      { status: 500 }
    );
  }
}
