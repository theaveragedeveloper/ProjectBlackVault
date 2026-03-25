import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

function calculateHitFactor(points: number, timeSeconds: number): number {
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    return 0;
  }

  if (!Number.isFinite(points) || points < 0) {
    return 0;
  }

  return Number((points / timeSeconds).toFixed(4));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;

    const session = await prisma.rangeSession.findUnique({ where: { id }, select: { id: true } });
    if (!session) {
      return NextResponse.json({ error: "Range session not found" }, { status: 404 });
    }

    const drills = await prisma.sessionDrill.findMany({
      where: { rangeSessionId: id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { setNumber: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(drills);
  } catch (error) {
    console.error("GET /api/range/sessions/[id]/drills error:", error);
    return NextResponse.json({ error: "Failed to fetch drills" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const { name, timeSeconds, points, penalties, hits, notes, sortOrder, setNumber, drillDate } = body;

    if (!name || timeSeconds === undefined || points === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, timeSeconds, points" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }

    if (typeof timeSeconds !== "number" || !Number.isFinite(timeSeconds) || timeSeconds <= 0) {
      return NextResponse.json({ error: "timeSeconds must be a positive number" }, { status: 400 });
    }

    if (typeof points !== "number" || !Number.isFinite(points) || points < 0) {
      return NextResponse.json({ error: "points must be a non-negative number" }, { status: 400 });
    }

    if (
      penalties !== undefined &&
      penalties !== null &&
      (typeof penalties !== "number" || !Number.isFinite(penalties) || penalties < 0)
    ) {
      return NextResponse.json({ error: "penalties must be a non-negative number" }, { status: 400 });
    }

    if (hits !== undefined && hits !== null && (typeof hits !== "number" || !Number.isInteger(hits) || hits < 0)) {
      return NextResponse.json({ error: "hits must be a non-negative integer" }, { status: 400 });
    }

    if (
      setNumber !== undefined &&
      setNumber !== null &&
      (typeof setNumber !== "number" || !Number.isInteger(setNumber) || setNumber < 1)
    ) {
      return NextResponse.json({ error: "setNumber must be an integer greater than 0" }, { status: 400 });
    }

    const session = await prisma.rangeSession.findUnique({ where: { id }, select: { id: true } });
    if (!session) {
      return NextResponse.json({ error: "Range session not found" }, { status: 404 });
    }

    const normalizedName = name.trim();
    const adjustedPoints = Math.max(0, points - (typeof penalties === "number" ? penalties : 0));
    const hitFactor = calculateHitFactor(adjustedPoints, timeSeconds);
    const fallbackSetNumber = await prisma.sessionDrill.count({
      where: {
        rangeSessionId: id,
        name: normalizedName,
      },
    }) + 1;

    const drill = await prisma.sessionDrill.create({
      data: {
        rangeSessionId: id,
        name: normalizedName,
        setNumber: typeof setNumber === "number" ? setNumber : fallbackSetNumber,
        timeSeconds,
        points,
        penalties: typeof penalties === "number" ? penalties : null,
        hits: typeof hits === "number" ? hits : null,
        hitFactor,
        notes: typeof notes === "string" ? notes.trim() || null : null,
        sortOrder: typeof sortOrder === "number" && Number.isInteger(sortOrder) ? sortOrder : 0,
        drillDate: drillDate ? new Date(drillDate) : null,
      },
    });

    return NextResponse.json(drill, { status: 201 });
  } catch (error) {
    console.error("POST /api/range/sessions/[id]/drills error:", error);
    return NextResponse.json({ error: "Failed to create drill" }, { status: 500 });
  }
}
