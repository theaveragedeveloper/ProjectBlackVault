import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptField, decryptField } from "@/lib/crypto";
import { revalidateDashboardCaches } from "@/lib/server/dashboard";
import { validateOptionalImageUrl } from "@/lib/image-url-validation";
import { requireAuth } from "@/lib/server/auth";
import { requireEntityWriteAccess } from "@/lib/server/entity-write-access";

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
  const auth = await requireAuth();
  if (auth) return auth;

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
      notes: await decryptField(accessory.notes),
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
  const auth = await requireAuth();
  if (auth) return auth;

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
      batteryIntervalDays,
    } = body;

    const existing = await prisma.accessory.findUnique({ where: { id } });
    const entityAccess = await requireEntityWriteAccess(request, "accessory", id);
    if (!entityAccess.ok) {
      return entityAccess.response;
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Accessory not found" },
        { status: 404 }
      );
    }

    if (imageUrl !== undefined) {
      const imageValidation = validateOptionalImageUrl(imageUrl);
      if (!imageValidation.valid) {
        return NextResponse.json({ error: imageValidation.error }, { status: 400 });
      }
    }

    if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice < 0) {
      return NextResponse.json({ error: "purchasePrice cannot be negative" }, { status: 400 });
    }

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
          acquisitionDate: acquisitionDate
            ? (() => { const d = new Date(acquisitionDate); return isNaN(d.getTime()) ? null : d; })()
            : null,
        }),
        ...(notes !== undefined && { notes: notes ? await encryptField(notes) : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(imageSource !== undefined && { imageSource }),
        ...(compatibleFirearmTypes !== undefined && { compatibleFirearmTypes }),
        ...(compatibleCalibers !== undefined && { compatibleCalibers }),
        ...(hasBattery !== undefined && { hasBattery }),
        ...(batteryType !== undefined && { batteryType: batteryType || null }),
        ...(batteryIntervalDays !== undefined && { batteryIntervalDays: batteryIntervalDays !== "" && batteryIntervalDays !== null ? parseInt(String(batteryIntervalDays), 10) : null }),
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

    revalidateDashboardCaches(["accessories"]);

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;

    const existing = await prisma.accessory.findUnique({ where: { id } });
    const entityAccess = await requireEntityWriteAccess(request, "accessory", id);
    if (!entityAccess.ok) {
      return entityAccess.response;
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Accessory not found" },
        { status: 404 }
      );
    }

    await prisma.accessory.delete({ where: { id } });

    revalidateDashboardCaches(["accessories"]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/accessories/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete accessory" },
      { status: 500 }
    );
  }
}
