import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { notes } = body;

  const schedule = await prisma.maintenanceSchedule.findUnique({
    where: { id },
    include: { firearm: { select: { id: true } } },
  });

  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Compute current firearm round count (sum of all session rounds fired)
  const roundAgg = await prisma.rangeSessionFirearm.aggregate({
    where: { firearmId: schedule.firearmId },
    _sum: { roundsFired: true },
  });
  const currentRoundCount = roundAgg._sum.roundsFired ?? 0;

  const now = new Date();

  const [completion, updated] = await prisma.$transaction([
    prisma.maintenanceCompletion.create({
      data: {
        scheduleId: id,
        completedAt: now,
        roundCountAtCompletion: currentRoundCount,
        notes: notes || null,
      },
    }),
    prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        lastCompletedAt: now,
        lastRoundCount: currentRoundCount,
      },
    }),
  ]);

  return NextResponse.json({ completion, schedule: updated });
}
