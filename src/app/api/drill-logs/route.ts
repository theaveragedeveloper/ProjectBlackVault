import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("templateId");

  const logs = await prisma.drillLog.findMany({
    where: templateId ? { templateId } : undefined,
    include: { template: { select: { id: true, name: true, scoringType: true, parTime: true, maxScore: true } } },
    orderBy: { performedAt: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { templateId, drillName, performedAt, timeSeconds, hits, totalShots, accuracy, score, notes } = body;

  if (!drillName) {
    return NextResponse.json({ error: "drillName is required" }, { status: 400 });
  }

  const log = await prisma.drillLog.create({
    data: {
      templateId: templateId || null,
      drillName,
      performedAt: performedAt ? new Date(performedAt) : new Date(),
      timeSeconds: timeSeconds !== undefined && timeSeconds !== "" ? Number(timeSeconds) : null,
      hits: hits !== undefined && hits !== "" ? Number(hits) : null,
      totalShots: totalShots !== undefined && totalShots !== "" ? Number(totalShots) : null,
      accuracy: accuracy !== undefined && accuracy !== "" ? Number(accuracy) : null,
      score: score !== undefined && score !== "" ? Number(score) : null,
      notes: notes || null,
    },
    include: { template: true },
  });

  return NextResponse.json(log, { status: 201 });
}
