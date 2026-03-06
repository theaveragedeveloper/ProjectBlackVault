import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/drill-templates/[id]/results
// Returns merged SessionDrill + DrillLog records for a template, sorted chronologically
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.drillTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const [sessionDrills, drillLogs] = await Promise.all([
      prisma.sessionDrill.findMany({
        where: { templateId: id },
        include: {
          session: { select: { id: true, date: true, rangeName: true } },
        },
        orderBy: { session: { date: "asc" } },
      }),
      prisma.drillLog.findMany({
        where: { templateId: id },
        orderBy: { performedAt: "asc" },
      }),
    ]);

    const sessionResults = sessionDrills.map((d) => ({
      id: d.id,
      source: "session" as const,
      sourceId: d.sessionId,
      date: d.session.date,
      rangeName: d.session.rangeName,
      timeSeconds: d.timeSeconds,
      score: d.score,
      accuracy: d.accuracy,
      hits: d.hits,
      totalShots: d.totalShots,
      notes: d.notes,
    }));

    const logResults = drillLogs.map((d) => ({
      id: d.id,
      source: "drill_log" as const,
      sourceId: d.id,
      date: d.performedAt,
      rangeName: null,
      timeSeconds: d.timeSeconds,
      score: d.score,
      accuracy: d.accuracy,
      hits: d.hits,
      totalShots: d.totalShots,
      notes: d.notes,
    }));

    const results = [...sessionResults, ...logResults].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const times = results.filter((r) => r.timeSeconds != null).map((r) => r.timeSeconds!);
    const scores = results.filter((r) => r.score != null).map((r) => r.score!);
    const accuracies = results.filter((r) => r.accuracy != null).map((r) => r.accuracy!);

    return NextResponse.json({
      template,
      results,
      stats: {
        runCount: results.length,
        bestTime: times.length ? Math.min(...times) : null,
        avgTime: times.length ? times.reduce((s, t) => s + t, 0) / times.length : null,
        bestScore: scores.length ? Math.max(...scores) : null,
        avgScore: scores.length ? scores.reduce((s, t) => s + t, 0) / scores.length : null,
        bestAccuracy: accuracies.length ? Math.max(...accuracies) : null,
        avgAccuracy: accuracies.length ? accuracies.reduce((s, t) => s + t, 0) / accuracies.length : null,
      },
    });
  } catch (error) {
    console.error("GET /api/drill-templates/[id]/results error:", error);
    return NextResponse.json({ error: "Failed to fetch drill results" }, { status: 500 });
  }
}
