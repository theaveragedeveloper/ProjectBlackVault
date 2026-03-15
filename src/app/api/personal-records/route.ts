import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/personal-records?limit=10
// Returns recent personal-best achievements across all drill templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10) || 10, 50);

    const templates = await prisma.drillTemplate.findMany({
      select: { id: true, name: true, scoringType: true },
    });

    const prs: {
      templateId: string;
      templateName: string;
      metric: "time" | "score" | "accuracy";
      value: number;
      unit: string;
      date: Date | string;
      source: "session" | "drill_log";
      sourceId: string;
    }[] = [];

    const results = await Promise.allSettled(
      templates.map(async (template) => {
        const [sessionDrills, drillLogs] = await Promise.all([
          prisma.sessionDrill.findMany({
            where: { templateId: template.id },
            select: {
              id: true,
              sessionId: true,
              timeSeconds: true,
              score: true,
              accuracy: true,
              session: { select: { date: true } },
            },
          }),
          prisma.drillLog.findMany({
            where: { templateId: template.id },
            select: { id: true, timeSeconds: true, score: true, accuracy: true, performedAt: true },
          }),
        ]);

        type ResultEntry = {
          id: string;
          source: "session" | "drill_log";
          sourceId: string;
          date: Date | string;
          timeSeconds: number | null;
          score: number | null;
          accuracy: number | null;
        };

        const allResults: ResultEntry[] = [
          ...sessionDrills.map((d) => ({
            id: d.id,
            source: "session" as const,
            sourceId: d.sessionId,
            date: d.session.date,
            timeSeconds: d.timeSeconds,
            score: d.score,
            accuracy: d.accuracy,
          })),
          ...drillLogs.map((d) => ({
            id: d.id,
            source: "drill_log" as const,
            sourceId: d.id,
            date: d.performedAt,
            timeSeconds: d.timeSeconds,
            score: d.score,
            accuracy: d.accuracy,
          })),
        ];

        if (allResults.length === 0) return;

        const times = allResults.filter((r) => r.timeSeconds != null);
        const scoreEntries = allResults.filter((r) => r.score != null);
        const accuracyEntries = allResults.filter((r) => r.accuracy != null);

        // Best time = lowest; find the most recent entry holding it
        if (times.length >= 1) {
          const bestTime = Math.min(...times.map((r) => r.timeSeconds!));
          const prEntry = times
            .filter((r) => r.timeSeconds === bestTime)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          if (prEntry) {
            prs.push({
              templateId: template.id,
              templateName: template.name,
              metric: "time",
              value: bestTime,
              unit: "s",
              date: prEntry.date,
              source: prEntry.source,
              sourceId: prEntry.sourceId,
            });
          }
        }

        // Best score = highest
        if (scoreEntries.length >= 1 && template.scoringType !== "NOTES_ONLY") {
          const bestScore = Math.max(...scoreEntries.map((r) => r.score!));
          const prEntry = scoreEntries
            .filter((r) => r.score === bestScore)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          if (prEntry) {
            prs.push({
              templateId: template.id,
              templateName: template.name,
              metric: template.scoringType === "PASS_FAIL" ? "score" : "score",
              value: bestScore,
              unit: template.scoringType === "PASS_FAIL" ? "" : "pts",
              date: prEntry.date,
              source: prEntry.source,
              sourceId: prEntry.sourceId,
            });
          }
        }

        // Best accuracy = highest
        if (accuracyEntries.length >= 1) {
          const bestAccuracy = Math.max(...accuracyEntries.map((r) => r.accuracy!));
          const prEntry = accuracyEntries
            .filter((r) => r.accuracy === bestAccuracy)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          if (prEntry) {
            prs.push({
              templateId: template.id,
              templateName: template.name,
              metric: "accuracy",
              value: bestAccuracy,
              unit: "%",
              date: prEntry.date,
              source: prEntry.source,
              sourceId: prEntry.sourceId,
            });
          }
        }
      })
    );
    results
      .filter((r) => r.status === "rejected")
      .forEach((r) => console.error("GET /api/personal-records template error:", (r as PromiseRejectedResult).reason));

    // Sort by date descending (most recently set PR first)
    prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(prs.slice(0, limit));
  } catch (error) {
    console.error("GET /api/personal-records error:", error);
    return NextResponse.json({ error: "Failed to fetch personal records" }, { status: 500 });
  }
}
