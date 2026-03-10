import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const log = await prisma.drillLog.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(log);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { drillName, performedAt, timeSeconds, hits, totalShots, accuracy, score, notes, templateId } = body;

  try {
    const log = await prisma.drillLog.update({
      where: { id },
      data: {
        ...(drillName !== undefined && { drillName }),
        ...(templateId !== undefined && { templateId: templateId || null }),
        ...(performedAt !== undefined && { performedAt: new Date(performedAt) }),
        ...(timeSeconds !== undefined && { timeSeconds: timeSeconds !== "" ? Number(timeSeconds) : null }),
        ...(hits !== undefined && { hits: hits !== "" ? Number(hits) : null }),
        ...(totalShots !== undefined && { totalShots: totalShots !== "" ? Number(totalShots) : null }),
        ...(accuracy !== undefined && { accuracy: accuracy !== "" ? Number(accuracy) : null }),
        ...(score !== undefined && { score: score !== "" ? Number(score) : null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: { template: true },
    });
    return NextResponse.json(log);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.drillLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
