import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

// PUT /api/range-sessions/[id]/drills/[drillId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; drillId: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { drillId } = await params;
    const body = await request.json();
    const { drillName, timeSeconds, hits, totalShots, accuracy, score, notes, sortOrder, templateId } = body;

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

    const drill = await prisma.sessionDrill.update({
      where: { id: drillId },
      data: {
        templateId: templateId !== undefined ? (templateId || null) : undefined,
        drillName: typeof drillName === "string" ? drillName.slice(0, 200) : undefined,
        timeSeconds: parseFloat_(timeSeconds),
        hits: parseInt_(hits),
        totalShots: parseInt_(totalShots),
        accuracy: parseFloat_(accuracy),
        score: parseFloat_(score),
        notes: typeof notes === "string" && notes ? notes.slice(0, 2000) : null,
        sortOrder: parseInt_(sortOrder) ?? undefined,
      },
      include: { template: true },
    });

    return NextResponse.json(drill);
  } catch (error) {
    console.error("PUT /api/range-sessions/[id]/drills/[drillId] error:", error);
    return NextResponse.json({ error: "Failed to update drill" }, { status: 500 });
  }
}

// DELETE /api/range-sessions/[id]/drills/[drillId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; drillId: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { drillId } = await params;
    await prisma.sessionDrill.delete({ where: { id: drillId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/range-sessions/[id]/drills/[drillId] error:", error);
    return NextResponse.json({ error: "Failed to delete drill" }, { status: 500 });
  }
}
