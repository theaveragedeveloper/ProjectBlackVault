import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

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
  const auth = await requireAuth();
  if (auth) return auth;

  const body = await req.json();
  const { templateId, drillName, performedAt, timeSeconds, hits, totalShots, accuracy, score, notes } = body;

  if (!drillName) {
    return NextResponse.json({ error: "drillName is required" }, { status: 400 });
  }

  const parsedTimeSeconds = timeSeconds !== undefined && timeSeconds !== "" ? Number(timeSeconds) : null;
  const parsedHits = hits !== undefined && hits !== "" ? Number(hits) : null;
  const parsedTotalShots = totalShots !== undefined && totalShots !== "" ? Number(totalShots) : null;
  const parsedAccuracy = accuracy !== undefined && accuracy !== "" ? Number(accuracy) : null;
  const parsedScore = score !== undefined && score !== "" ? Number(score) : null;

  if (parsedTimeSeconds !== null && isNaN(parsedTimeSeconds)) {
    return NextResponse.json({ error: "timeSeconds must be a valid number" }, { status: 400 });
  }
  if (parsedHits !== null && isNaN(parsedHits)) {
    return NextResponse.json({ error: "hits must be a valid number" }, { status: 400 });
  }
  if (parsedTotalShots !== null && isNaN(parsedTotalShots)) {
    return NextResponse.json({ error: "totalShots must be a valid number" }, { status: 400 });
  }
  if (parsedAccuracy !== null && isNaN(parsedAccuracy)) {
    return NextResponse.json({ error: "accuracy must be a valid number" }, { status: 400 });
  }
  if (parsedScore !== null && isNaN(parsedScore)) {
    return NextResponse.json({ error: "score must be a valid number" }, { status: 400 });
  }

  const log = await prisma.drillLog.create({
    data: {
      templateId: templateId || null,
      drillName,
      performedAt: performedAt ? new Date(performedAt) : new Date(),
      timeSeconds: parsedTimeSeconds,
      hits: parsedHits,
      totalShots: parsedTotalShots,
      accuracy: parsedAccuracy,
      score: parsedScore,
      notes: notes || null,
    },
    include: { template: true },
  });

  return NextResponse.json(log, { status: 201 });
}
