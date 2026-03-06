import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = await prisma.maintenanceSchedule.findUnique({
    where: { id },
    include: {
      firearm: { select: { id: true, name: true } },
      completions: { orderBy: { completedAt: "desc" } },
    },
  });

  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(schedule);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { taskName, intervalType, intervalValue, notes } = body;

  const schedule = await prisma.maintenanceSchedule.update({
    where: { id },
    data: {
      ...(taskName !== undefined && { taskName }),
      ...(intervalType !== undefined && { intervalType }),
      ...(intervalValue !== undefined && { intervalValue: parseInt(intervalValue) }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  return NextResponse.json(schedule);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.maintenanceSchedule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
