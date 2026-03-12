import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptField, decryptField } from "@/lib/crypto";
import { revalidateDashboardCaches } from "@/lib/server/dashboard";

// GET /api/firearms/[id] - Get a single firearm with active build, slots, and accessories
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const firearm = await prisma.firearm.findUnique({
      where: { id },
      include: {
        _count: {
          select: { builds: true },
        },
        builds: {
          include: {
            slots: {
              include: {
                accessory: true,
              },
            },
          },
          orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
        },
      },
    });

    if (!firearm) {
      return NextResponse.json({ error: "Firearm not found" }, { status: 404 });
    }

    const activeBuild = firearm.builds.find((b) => b.isActive) ?? null;

    return NextResponse.json({
      ...firearm,
      serialNumber: (await decryptField(firearm.serialNumber)) ?? firearm.serialNumber,
      notes: await decryptField(firearm.notes),
      buildCount: firearm._count.builds,
      activeBuild,
      _count: undefined,
    });
  } catch (error) {
    console.error("GET /api/firearms/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to fetch firearm" },
      { status: 500 }
    );
  }
}

// PUT /api/firearms/[id] - Update a firearm
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
      caliber,
      serialNumber,
      type,
      acquisitionDate,
      purchasePrice,
      currentValue,
      notes,
      imageUrl,
      imageSource,
    } = body;

    const existing = await prisma.firearm.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Firearm not found" }, { status: 404 });
    }

    if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice < 0) {
      return NextResponse.json({ error: "purchasePrice cannot be negative" }, { status: 400 });
    }
    if (currentValue !== undefined && currentValue !== null && currentValue < 0) {
      return NextResponse.json({ error: "currentValue cannot be negative" }, { status: 400 });
    }

    const updated = await prisma.firearm.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(manufacturer !== undefined && { manufacturer }),
        ...(model !== undefined && { model }),
        ...(caliber !== undefined && { caliber }),
        ...(serialNumber !== undefined && {
          serialNumber: serialNumber ? await encryptField(serialNumber) : null,
        }),
        ...(type !== undefined && { type }),
        ...(acquisitionDate !== undefined && {
          acquisitionDate: new Date(acquisitionDate),
        }),
        ...(purchasePrice !== undefined && { purchasePrice }),
        ...(currentValue !== undefined && { currentValue }),
        ...(notes !== undefined && { notes: notes ? await encryptField(notes) : null }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(imageSource !== undefined && { imageSource }),
      },
      include: {
        _count: {
          select: { builds: true },
        },
        builds: {
          where: { isActive: true },
          take: 1,
          include: {
            slots: {
              include: { accessory: true },
            },
          },
        },
      },
    });

    revalidateDashboardCaches(["firearms"]);

    return NextResponse.json({
      ...updated,
      buildCount: updated._count.builds,
      activeBuild: updated.builds[0] ?? null,
      builds: undefined,
      _count: undefined,
    });
  } catch (error: unknown) {
    console.error("PUT /api/firearms/[id] error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed") &&
      error.message.includes("serialNumber")
    ) {
      return NextResponse.json(
        { error: "A firearm with that serial number already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update firearm" },
      { status: 500 }
    );
  }
}

// DELETE /api/firearms/[id] - Delete a firearm
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.firearm.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Firearm not found" }, { status: 404 });
    }

    await prisma.firearm.delete({ where: { id } });

    revalidateDashboardCaches(["firearms"]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/firearms/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete firearm" },
      { status: 500 }
    );
  }
}
