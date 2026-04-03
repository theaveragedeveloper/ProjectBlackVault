import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardData } from "@/lib/dashboard/revalidate-dashboard";

// GET /api/accessories/[id]/battery-log - Get battery change history
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const accessory = await prisma.accessory.findUnique({ where: { id } });
    if (!accessory) {
      return NextResponse.json({ error: "Accessory not found" }, { status: 404 });
    }

    const logs = await prisma.batteryChangeLog.findMany({
      where: { accessoryId: id },
      orderBy: { changedAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/accessories/[id]/battery-log error:", error);
    return NextResponse.json({ error: "Failed to fetch battery log" }, { status: 500 });
  }
}

// POST /api/accessories/[id]/battery-log - Log a battery change
// Body: { changedAt?: string, batteryType?: string, notes?: string }
// Creates a BatteryChangeLog entry and updates lastBatteryChangeDate on the accessory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { changedAt, batteryType, notes } = body;

    const accessory = await prisma.accessory.findUnique({ where: { id } });
    if (!accessory) {
      return NextResponse.json({ error: "Accessory not found" }, { status: 404 });
    }

    const changeDate = changedAt ? new Date(changedAt) : new Date();

    const updateData: Record<string, unknown> = {
      lastBatteryChangeDate: changeDate,
      hasBattery: true,
    };
    if (batteryType && batteryType !== accessory.batteryType) {
      updateData.batteryType = batteryType;
    }

    const [log] = await prisma.$transaction([
      prisma.batteryChangeLog.create({
        data: {
          accessoryId: id,
          changedAt: changeDate,
          batteryType: batteryType ?? accessory.batteryType ?? null,
          notes: notes ?? null,
        },
      }),
      prisma.accessory.update({
        where: { id },
        data: updateData,
      }),
    ]);

    revalidateDashboardData();

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("POST /api/accessories/[id]/battery-log error:", error);
    return NextResponse.json({ error: "Failed to log battery change" }, { status: 500 });
  }
}
