import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardData } from "@/lib/dashboard/revalidate-dashboard";
import { decryptField } from "@/lib/crypto";


function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fallbackSerialNumber() {
  return `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

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
      serialNumber: decryptField(firearm.serialNumber),
      notes: firearm.notes,
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
      compatibleCalibers,
      serialNumber,
      type,
      acquisitionDate,
      purchasePrice,
      currentValue,
      notes,
      imageUrl,
      imageSource,
      lastMaintenanceDate,
      maintenanceIntervalDays,
    } = body;

    const existing = await prisma.firearm.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Firearm not found" }, { status: 404 });
    }

    const updated = await prisma.firearm.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: normalizeString(name) || existing.name }),
        ...(manufacturer !== undefined && { manufacturer: normalizeString(manufacturer) || "Unknown" }),
        ...(model !== undefined && { model: normalizeString(model) || "Unknown" }),
        ...(caliber !== undefined && { caliber: normalizeString(caliber) || "Unknown" }),
        ...(compatibleCalibers !== undefined && {
          compatibleCalibers: compatibleCalibers
            ? compatibleCalibers.split(",").map((s: string) => s.trim()).filter(Boolean).join(",") || null
            : null,
        }),
        ...(serialNumber !== undefined && { serialNumber: normalizeString(serialNumber) || fallbackSerialNumber() }),
        ...(type !== undefined && { type: normalizeString(type) || "UNSPECIFIED" }),
        ...(acquisitionDate !== undefined && {
          acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : existing.acquisitionDate,
        }),
        ...(purchasePrice !== undefined && { purchasePrice }),
        ...(currentValue !== undefined && { currentValue }),
        ...(notes !== undefined && { notes: notes ? normalizeString(notes) : null }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(imageSource !== undefined && { imageSource }),
        ...(lastMaintenanceDate !== undefined && {
          lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        }),
        ...(maintenanceIntervalDays !== undefined && { maintenanceIntervalDays }),
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

    revalidateDashboardData();

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
    revalidateDashboardData();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/firearms/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete firearm" },
      { status: 500 }
    );
  }
}
