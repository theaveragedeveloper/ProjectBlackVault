import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/accessories - List all accessories with current build name
export async function GET() {
  try {
    const accessories = await prisma.accessory.findMany({
      include: {
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Attach the name of the currently active build (if any)
    const result = accessories.map((accessory) => {
      const activeSlot = accessory.buildSlots.find(
        (slot) => slot.build.isActive
      );
      return {
        ...accessory,
        currentBuild: activeSlot
          ? {
              id: activeSlot.build.id,
              name: activeSlot.build.name,
              slotType: activeSlot.slotType,
              firearm: activeSlot.build.firearm,
            }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/accessories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accessories" },
      { status: 500 }
    );
  }
}

// POST /api/accessories - Create a new accessory
export async function POST(request: NextRequest) {
  try {
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
      hasBattery,
      batteryType,
      lastBatteryChangeDate,
      replacementIntervalDays,
    } = body;

    if (!name || !manufacturer || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, manufacturer, type" },
        { status: 400 }
      );
    }

    const accessory = await prisma.accessory.create({
      data: {
        name,
        manufacturer,
        model: model ?? null,
        type,
        caliber: caliber ?? null,
        purchasePrice: purchasePrice ?? null,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        notes: notes ?? null,
        imageUrl: imageUrl ?? null,
        imageSource: imageSource ?? null,
        compatibleFirearmTypes: compatibleFirearmTypes ?? null,
        compatibleCalibers: compatibleCalibers ?? null,
        hasBattery: Boolean(hasBattery),
        batteryType: batteryType ?? null,
        lastBatteryChangeDate: lastBatteryChangeDate ? new Date(lastBatteryChangeDate) : null,
        replacementIntervalDays: replacementIntervalDays ?? null,
      },
    });

    return NextResponse.json(accessory, { status: 201 });
  } catch (error) {
    console.error("POST /api/accessories error:", error);
    return NextResponse.json(
      { error: "Failed to create accessory" },
      { status: 500 }
    );
  }
}
