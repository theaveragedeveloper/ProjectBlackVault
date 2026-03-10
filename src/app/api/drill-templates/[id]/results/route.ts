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
          session: {
            select: {
              id: true,
              date: true,
              rangeName: true,
              buildId: true,
              build: { select: { id: true, name: true } },
            },
          },
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
      buildId: d.session.buildId,
      buildName: d.session.build?.name ?? null,
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
      buildId: null,
      buildName: null,
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

    const stats = {
      runCount: results.length,
      bestTime: times.length ? Math.min(...times) : null,
      avgTime: times.length ? times.reduce((s, t) => s + t, 0) / times.length : null,
      bestScore: scores.length ? Math.max(...scores) : null,
      avgScore: scores.length ? scores.reduce((s, t) => s + t, 0) / scores.length : null,
      bestAccuracy: accuracies.length ? Math.max(...accuracies) : null,
      avgAccuracy: accuracies.length ? accuracies.reduce((s, t) => s + t, 0) / accuracies.length : null,
    };

    // Tag personal-record entries
    const taggedResults = results.map((r) => ({
      ...r,
      isTimePR: stats.bestTime != null && r.timeSeconds === stats.bestTime,
      isScorePR: stats.bestScore != null && r.score === stats.bestScore,
      isAccuracyPR: stats.bestAccuracy != null && r.accuracy === stats.bestAccuracy,
    }));

    // Build per-build breakdown (session-sourced results only, builds with >= 2 runs)
    type BuildAgg = {
      buildName: string;
      runs: number;
      times: number[];
      scores: number[];
      accuracies: number[];
    };
    const buildMap: Record<string, BuildAgg> = {};
    for (const r of sessionResults) {
      const key = r.buildId ?? "__none__";
      const name = r.buildName ?? "No Build";
      if (!buildMap[key]) buildMap[key] = { buildName: name, runs: 0, times: [], scores: [], accuracies: [] };
      buildMap[key].runs++;
      if (r.timeSeconds != null) buildMap[key].times.push(r.timeSeconds);
      if (r.score != null) buildMap[key].scores.push(r.score);
      if (r.accuracy != null) buildMap[key].accuracies.push(r.accuracy);
    }

    const byBuild: Record<string, {
      buildName: string;
      runs: number;
      bestTime: number | null;
      avgTime: number | null;
      bestScore: number | null;
      avgScore: number | null;
      bestAccuracy: number | null;
      avgAccuracy: number | null;
    }> = {};

    for (const [key, agg] of Object.entries(buildMap)) {
      if (agg.runs < 2) continue; // need at least 2 entries to compare
      byBuild[key] = {
        buildName: agg.buildName,
        runs: agg.runs,
        bestTime: agg.times.length ? Math.min(...agg.times) : null,
        avgTime: agg.times.length ? agg.times.reduce((s, t) => s + t, 0) / agg.times.length : null,
        bestScore: agg.scores.length ? Math.max(...agg.scores) : null,
        avgScore: agg.scores.length ? agg.scores.reduce((s, t) => s + t, 0) / agg.scores.length : null,
        bestAccuracy: agg.accuracies.length ? Math.max(...agg.accuracies) : null,
        avgAccuracy: agg.accuracies.length ? agg.accuracies.reduce((s, t) => s + t, 0) / agg.accuracies.length : null,
      };
    }

    return NextResponse.json({ template, results: taggedResults, stats, byBuild });
  } catch (error) {
    console.error("GET /api/drill-templates/[id]/results error:", error);
    return NextResponse.json({ error: "Failed to fetch drill results" }, { status: 500 });
  }
}
