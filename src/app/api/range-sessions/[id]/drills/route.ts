import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

// POST /api/range-sessions/[id]/drills - Add a drill result to a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const {
      templateId,
      drillName,
      timeSeconds,
      hits,
      totalShots,
      accuracy,
      score,
      notes,
      sortOrder,
    } = body;

    if (!drillName) {
      return NextResponse.json({ error: "drillName is required" }, { status: 400 });
    }

    const parseFloat_ = (v: unknown) => {
      if (v === null || v === undefined || v === "") return null;
      const n = parseFloat(String(v));
      return Number.isFinite(n) ? n : null;
    };
    const parseInt_ = (v: unknown) => {
      if (v === null || v === undefined || v === "") return null;
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : null;
    };

    const drill = await prisma.sessionDrill.create({
      data: {
        sessionId,
        templateId: templateId || null,
        drillName: String(drillName).slice(0, 200),
        timeSeconds: parseFloat_(timeSeconds),
        hits: parseInt_(hits),
        totalShots: parseInt_(totalShots),
        accuracy: parseFloat_(accuracy),
        score: parseFloat_(score),
        notes: typeof notes === "string" && notes ? notes.slice(0, 2000) : null,
        sortOrder: parseInt_(sortOrder) ?? 0,
      },
      include: { template: true },
    });

    return NextResponse.json(drill, { status: 201 });
  } catch (error) {
    console.error("POST /api/range-sessions/[id]/drills error:", error);
    return NextResponse.json({ error: "Failed to add drill" }, { status: 500 });
  }
}
