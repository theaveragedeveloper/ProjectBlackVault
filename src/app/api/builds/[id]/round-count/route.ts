import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/builds/[id]/round-count
// Returns manualRoundCount, sessionRoundCount, totalRoundCount, and a merged log
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const build = await prisma.build.findUnique({
      where: { id },
      select: { roundCount: true },
    });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    // Sum rounds from all linked range sessions
    const sessionAggregate = await prisma.rangeSession.aggregate({
      where: { buildId: id },
      _sum: { roundsFired: true },
    });
    const sessionRoundCount = sessionAggregate._sum.roundsFired ?? 0;

    // Manual log entries
    const manualLogs = await prisma.buildRoundCountLog.findMany({
      where: { buildId: id },
      orderBy: { loggedAt: "desc" },
    });

    // Session entries for the timeline
    const sessions = await prisma.rangeSession.findMany({
      where: { buildId: id },
      select: {
        id: true,
        location: true,
        roundsFired: true,
        sessionDate: true,
      },
      orderBy: { sessionDate: "desc" },
    });

    // Merge and sort descending by date
    type LogEntry =
      | {
          type: "manual";
          id: string;
          roundsAdded: number;
          previousCount: number;
          newCount: number;
          sessionNote: string | null;
          loggedAt: string;
          date: string;
        }
      | {
          type: "session";
          sessionId: string;
          location: string;
          roundsAdded: number;
          sessionDate: string;
          date: string;
        };

    const merged: LogEntry[] = [
      ...manualLogs.map((l) => ({
        type: "manual" as const,
        id: l.id,
        roundsAdded: l.roundsAdded,
        previousCount: l.previousCount,
        newCount: l.newCount,
        sessionNote: l.sessionNote,
        loggedAt: l.loggedAt.toISOString(),
        date: l.loggedAt.toISOString(),
      })),
      ...sessions.map((s) => ({
        type: "session" as const,
        sessionId: s.id,
        location: s.location,
        roundsAdded: s.roundsFired ?? 0,
        sessionDate: s.sessionDate.toISOString(),
        date: s.sessionDate.toISOString(),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      manualRoundCount: build.roundCount,
      sessionRoundCount,
      totalRoundCount: build.roundCount + sessionRoundCount,
      logs: merged,
    });
  } catch (error) {
    console.error("GET /api/builds/[id]/round-count error:", error);
    return NextResponse.json(
      { error: "Failed to fetch round count" },
      { status: 500 }
    );
  }
}

// POST /api/builds/[id]/round-count
// Body: { roundsAdded: number, sessionNote?: string }
// Atomically updates Build.roundCount and creates a BuildRoundCountLog entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { roundsAdded, sessionNote } = body;

    if (
      roundsAdded === undefined ||
      roundsAdded === null ||
      typeof roundsAdded !== "number" ||
      !Number.isInteger(roundsAdded) ||
      roundsAdded <= 0
    ) {
      return NextResponse.json(
        { error: "roundsAdded must be a positive integer" },
        { status: 400 }
      );
    }

    if (sessionNote !== undefined && typeof sessionNote !== "string") {
      return NextResponse.json(
        { error: "sessionNote must be a string" },
        { status: 400 }
      );
    }

    const build = await prisma.build.findUnique({
      where: { id },
      select: { roundCount: true },
    });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    const previousCount = build.roundCount;
    const newCount = previousCount + roundsAdded;

    await prisma.$transaction([
      prisma.build.update({
        where: { id },
        data: { roundCount: { increment: roundsAdded } },
      }),
      prisma.buildRoundCountLog.create({
        data: {
          buildId: id,
          roundsAdded,
          previousCount,
          newCount,
          sessionNote: sessionNote ?? null,
        },
      }),
    ]);

    // Recompute session total for response
    const sessionAggregate = await prisma.rangeSession.aggregate({
      where: { buildId: id },
      _sum: { roundsFired: true },
    });
    const sessionRoundCount = sessionAggregate._sum.roundsFired ?? 0;

    return NextResponse.json(
      {
        manualRoundCount: newCount,
        sessionRoundCount,
        totalRoundCount: newCount + sessionRoundCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/builds/[id]/round-count error:", error);
    return NextResponse.json(
      { error: "Failed to add round count" },
      { status: 500 }
    );
  }
}
