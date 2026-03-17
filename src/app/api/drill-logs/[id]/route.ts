import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await params;
  const log = await prisma.drillLog.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(log);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await params;
  const body = await req.json();
  const { drillName, performedAt, timeSeconds, hits, totalShots, accuracy, score, notes, templateId } = body;

  try {
    if (performedAt !== undefined) {
      const parsedDate = new Date(performedAt);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "performedAt must be a valid date" }, { status: 400 });
      }
    }

    const parsedTimeSeconds = timeSeconds !== undefined && timeSeconds !== "" ? Number(timeSeconds) : null;
    const parsedHits = hits !== undefined && hits !== "" ? Number(hits) : null;
    const parsedTotalShots = totalShots !== undefined && totalShots !== "" ? Number(totalShots) : null;
    const parsedAccuracy = accuracy !== undefined && accuracy !== "" ? Number(accuracy) : null;
    const parsedScore = score !== undefined && score !== "" ? Number(score) : null;

    if (timeSeconds !== undefined && parsedTimeSeconds !== null && isNaN(parsedTimeSeconds)) {
      return NextResponse.json({ error: "timeSeconds must be a valid number" }, { status: 400 });
    }
    if (hits !== undefined && parsedHits !== null && isNaN(parsedHits)) {
      return NextResponse.json({ error: "hits must be a valid number" }, { status: 400 });
    }
    if (totalShots !== undefined && parsedTotalShots !== null && isNaN(parsedTotalShots)) {
      return NextResponse.json({ error: "totalShots must be a valid number" }, { status: 400 });
    }
    if (accuracy !== undefined && parsedAccuracy !== null && isNaN(parsedAccuracy)) {
      return NextResponse.json({ error: "accuracy must be a valid number" }, { status: 400 });
    }
    if (score !== undefined && parsedScore !== null && isNaN(parsedScore)) {
      return NextResponse.json({ error: "score must be a valid number" }, { status: 400 });
    }

    const log = await prisma.drillLog.update({
      where: { id },
      data: {
        ...(drillName !== undefined && { drillName }),
        ...(templateId !== undefined && { templateId: templateId || null }),
        ...(performedAt !== undefined && { performedAt: new Date(performedAt) }),
        ...(timeSeconds !== undefined && { timeSeconds: parsedTimeSeconds }),
        ...(hits !== undefined && { hits: parsedHits }),
        ...(totalShots !== undefined && { totalShots: parsedTotalShots }),
        ...(accuracy !== undefined && { accuracy: parsedAccuracy }),
        ...(score !== undefined && { score: parsedScore }),
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
  const auth = await requireAuth();
  if (auth) return auth;

  const { id } = await params;
  try {
    await prisma.drillLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
