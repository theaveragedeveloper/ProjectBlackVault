import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

// GET /api/drill-templates/[id]/results
// Returns all SessionDrill records for a template with session dates, sorted chronologically
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;

    const template = await prisma.drillTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const legacyLinkedRows = template.isBuiltIn
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT sd."id"
          FROM "SessionDrill" sd
          WHERE sd."templateId" IS NULL
            AND lower(trim(sd."drillName")) = lower(trim(${template.name}))
        `
      : [];
    const legacyLinkedIds = legacyLinkedRows.map((row) => row.id);

    const drills = await prisma.sessionDrill.findMany({
      where: template.isBuiltIn
        ? {
            OR: [
              { templateId: id },
              ...(legacyLinkedIds.length > 0 ? [{ id: { in: legacyLinkedIds } }] : []),
            ],
          }
        : { templateId: id },
      include: {
        session: { select: { id: true, date: true, rangeName: true } },
      },
      orderBy: { session: { date: "asc" } },
    });

    const results = drills.map((d) => ({
      id: d.id,
      sessionId: d.sessionId,
      sessionDate: d.session.date,
      rangeName: d.session.rangeName,
      timeSeconds: d.timeSeconds,
      score: d.score,
      accuracy: d.accuracy,
      hits: d.hits,
      totalShots: d.totalShots,
      notes: d.notes,
    }));

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
