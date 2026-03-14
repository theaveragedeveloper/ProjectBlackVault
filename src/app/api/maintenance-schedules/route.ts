import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firearmId = searchParams.get("firearmId");

  const schedules = await prisma.maintenanceSchedule.findMany({
    where: firearmId ? { firearmId } : undefined,
    include: {
      firearm: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Include current round count for round-based due calculations
  let currentRoundCount: number | null = null;
  if (firearmId) {
    const agg = await prisma.sessionFirearm.aggregate({
      where: { firearmId },
      _sum: { roundsFired: true },
    });
    currentRoundCount = agg._sum.roundsFired ?? 0;
  }

  return NextResponse.json({ schedules, currentRoundCount });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firearmId, taskName, intervalType, intervalValue, notes } = body;

  if (!firearmId || !taskName || !intervalType || !intervalValue) {
    return NextResponse.json({ error: "firearmId, taskName, intervalType, and intervalValue are required" }, { status: 400 });
  }

  if (intervalType !== "ROUNDS" && intervalType !== "DAYS") {
    return NextResponse.json({ error: "intervalType must be ROUNDS or DAYS" }, { status: 400 });
  }

  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      firearmId,
      taskName,
      intervalType,
      intervalValue: parseInt(intervalValue),
      notes: notes || null,
    },
    include: {
      firearm: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}
