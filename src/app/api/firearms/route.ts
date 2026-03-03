import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    } = body;

    if (!name || !manufacturer || !model || !caliber || !serialNumber || !type || !acquisitionDate) {
      return NextResponse.json(
        { error: "Missing required fields: name, manufacturer, model, caliber, serialNumber, type, acquisitionDate" },
        { status: 400 }
      );
    }

    const firearm = await prisma.firearm.create({
      data: {
        name,
        manufacturer,
        model,
        caliber,
        serialNumber,
        type,
        acquisitionDate: new Date(acquisitionDate),
        purchasePrice: purchasePrice ?? null,
        currentValue: currentValue ?? null,
        notes: notes ?? null,
        imageUrl: imageUrl ?? null,
        imageSource: imageSource ?? null,
      },
      include: {
        _count: {
          select: { builds: true },
        },
      },
    });

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
