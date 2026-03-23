import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardData } from "@/lib/dashboard/revalidate-dashboard";


function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fallbackSerialNumber() {
  return `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// GET /api/firearms - List all firearms with build count
export async function GET() {
  try {
    const firearms = await prisma.firearm.findMany({
      include: {
        _count: {
          select: { builds: true },
        },
        builds: {
          where: { isActive: true },
          take: 1,
          include: {
            slots: {
              include: {
                accessory: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = firearms.map((firearm) => ({
      ...firearm,
      serialNumber: firearm.serialNumber,
      notes: firearm.notes,
      buildCount: firearm._count.builds,
      activeBuild: firearm.builds[0] ?? null,
      builds: undefined,
      _count: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/firearms error:", error);
    return NextResponse.json(
      { error: "Failed to fetch firearms" },
      { status: 500 }
    );
  }
}

// POST /api/firearms - Create a new firearm
export async function POST(request: NextRequest) {
  try {
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
      lastMaintenanceDate,
      maintenanceIntervalDays,
    } = body;

    const normalizedName = normalizeString(name);
    if (!normalizedName) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const firearm = await prisma.firearm.create({
      data: {
        name: normalizedName,
        manufacturer: normalizeString(manufacturer) || "Unknown",
        model: normalizeString(model) || "Unknown",
        caliber: normalizeString(caliber) || "Unknown",
        serialNumber: normalizeString(serialNumber) || fallbackSerialNumber(),
        type: normalizeString(type) || "UNSPECIFIED",
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
        purchasePrice: purchasePrice ?? null,
        currentValue: currentValue ?? null,
        notes: notes ? normalizeString(notes) : null,
        imageUrl: imageUrl ?? null,
        imageSource: imageSource ?? null,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        maintenanceIntervalDays: maintenanceIntervalDays ?? null,
      },
      include: {
        _count: {
          select: { builds: true },
        },
      },
    });

    revalidateDashboardData();

    return NextResponse.json(
      { ...firearm, buildCount: firearm._count.builds, _count: undefined },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/firearms error:", error);
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
      { error: "Failed to create firearm" },
      { status: 500 }
    );
  }
}
