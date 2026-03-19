import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseBatteryIntervalDays(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseBatteryDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
      hasBattery,
      batteryType,
      batteryReplacementIntervalDays,
      lastBatteryChangeDate,
      batteryNotes,
    } = body;

    const existing = await prisma.accessory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Accessory not found" },
        { status: 404 }
      );
    }

    const hasBatteryProvided = hasBattery !== undefined;
    const hasBatteryFlag = Boolean(hasBattery);

    const batteryData = hasBatteryProvided
      ? hasBatteryFlag
        ? {
            hasBattery: true,
            batteryType:
              typeof batteryType === "string" && batteryType.trim()
                ? batteryType.trim()
                : null,
            batteryReplacementIntervalDays: parseBatteryIntervalDays(
              batteryReplacementIntervalDays
            ),
            lastBatteryChangeDate: parseBatteryDate(lastBatteryChangeDate),
            batteryNotes:
              typeof batteryNotes === "string" && batteryNotes.trim()
                ? batteryNotes.trim().slice(0, 1000)
                : null,
          }
        : {
            hasBattery: false,
            batteryType: null,
            batteryReplacementIntervalDays: null,
            lastBatteryChangeDate: null,
            batteryNotes: null,
          }
      : {
          ...(batteryType !== undefined && {
            batteryType:
              typeof batteryType === "string" && batteryType.trim()
                ? batteryType.trim()
                : null,
          }),
          ...(batteryReplacementIntervalDays !== undefined && {
            batteryReplacementIntervalDays: parseBatteryIntervalDays(
              batteryReplacementIntervalDays
            ),
          }),
          ...(lastBatteryChangeDate !== undefined && {
            lastBatteryChangeDate: parseBatteryDate(lastBatteryChangeDate),
          }),
          ...(batteryNotes !== undefined && {
            batteryNotes:
              typeof batteryNotes === "string" && batteryNotes.trim()
                ? batteryNotes.trim().slice(0, 1000)
                : null,
          }),
        };

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
          acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        }),
        ...(notes !== undefined && { notes }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(imageSource !== undefined && { imageSource }),
        ...(compatibleFirearmTypes !== undefined && { compatibleFirearmTypes }),
        ...(compatibleCalibers !== undefined && { compatibleCalibers }),
        ...batteryData,
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
