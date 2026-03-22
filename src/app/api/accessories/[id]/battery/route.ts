import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/accessories/[id]/battery - mark battery replacement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const changeDate = body.lastBatteryChangeDate
      ? new Date(body.lastBatteryChangeDate)
      : new Date();

    const updated = await prisma.accessory.update({
      where: { id },
      data: {
        hasBattery: true,
        batteryType: body.batteryType ?? undefined,
        replacementIntervalDays:
          body.replacementIntervalDays !== undefined
            ? body.replacementIntervalDays
            : undefined,
        lastBatteryChangeDate: changeDate,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/accessories/[id]/battery error:", error);
    return NextResponse.json(
      { error: "Failed to update battery tracking" },
      { status: 500 }
    );
  }
}
