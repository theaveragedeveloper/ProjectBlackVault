import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptField, decryptField } from "@/lib/crypto";

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

    const result = await Promise.all(
      firearms.map(async (firearm) => ({
        ...firearm,
        serialNumber: firearm.serialNumber
          ? ((await decryptField(firearm.serialNumber)) ?? firearm.serialNumber)
          : null,
        notes: await decryptField(firearm.notes),
        buildCount: firearm._count.builds,
        activeBuild: firearm.builds[0] ?? null,
        builds: undefined,
        _count: undefined,
      }))
    );

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

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const firearm = await prisma.firearm.create({
      data: {
        name,
        manufacturer: manufacturer || "",
        model: model || "",
        caliber: caliber || "",
        serialNumber: serialNumber ? await encryptField(serialNumber) : null,
        type: type || "",
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        purchasePrice: purchasePrice ?? null,
        currentValue: currentValue ?? null,
        notes: notes ? await encryptField(notes) : null,
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
