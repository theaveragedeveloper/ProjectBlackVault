import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardCaches } from "@/lib/server/dashboard";
import { validateOptionalImageUrl } from "@/lib/image-url-validation";
import { requireAuth } from "@/lib/server/auth";

const BATTERY_TRACKED_SLOT_TYPES = new Set(["OPTIC", "LIGHT", "LASER"]);

// GET /api/accessories - List all accessories with current build name
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");

    const accessories = await prisma.accessory.findMany({
      where: typeFilter ? { type: typeFilter } : undefined,
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
  const auth = await requireAuth();
  if (auth) return auth;

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
      batteryIntervalDays,
    } = body;

    const imageValidation = validateOptionalImageUrl(imageUrl);
    if (!imageValidation.valid) {
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
    }

    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }

    const shouldEnableBattery = hasBattery !== undefined
      ? Boolean(hasBattery)
      : BATTERY_TRACKED_SLOT_TYPES.has(type);

    const accessory = await prisma.accessory.create({
      data: {
        name,
        manufacturer: manufacturer || "",
        model: model ?? null,
        type,
        caliber: caliber ?? null,
        purchasePrice: purchasePrice ?? null,
        acquisitionDate: acquisitionDate
          ? (() => {
              const d = new Date(acquisitionDate);
              return isNaN(d.getTime()) ? null : d;
            })()
          : null,
        notes: notes ?? null,
        imageUrl: imageValidation.normalized,
        imageSource: imageSource ?? null,
        compatibleFirearmTypes: compatibleFirearmTypes ?? null,
        compatibleCalibers: compatibleCalibers ?? null,
        hasBattery: shouldEnableBattery,
        batteryType: shouldEnableBattery ? batteryType ?? null : null,
        batteryIntervalDays: shouldEnableBattery
          ? batteryIntervalDays !== undefined && batteryIntervalDays !== null && batteryIntervalDays !== ""
            ? parseInt(String(batteryIntervalDays), 10)
            : null
          : null,
      },
    });

    revalidateDashboardCaches(["accessories"]);

    return NextResponse.json(accessory, { status: 201 });
  } catch (error) {
    console.error("POST /api/accessories error:", error);

    return NextResponse.json(
      { error: "Failed to create accessory" },
      { status: 500 }
    );
  }
}
