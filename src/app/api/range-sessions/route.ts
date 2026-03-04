import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/range-sessions - List range sessions, optional ?firearmId= filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const sessions = await prisma.rangeSession.findMany({
      where: firearmId ? { firearmId } : undefined,
      include: {
        firearm: { select: { id: true, name: true } },
        build: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/range-sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch range sessions" }, { status: 500 });
  }
}

// POST /api/range-sessions - Create a new range session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firearmId, buildId, roundsFired, rangeName, rangeLocation, notes, date } = body;

    if (!firearmId || !roundsFired) {
      return NextResponse.json(
        { error: "Missing required fields: firearmId, roundsFired" },
        { status: 400 }
      );
    }

    const session = await prisma.rangeSession.create({
      data: {
        firearmId,
        buildId: buildId || null,
        roundsFired: parseInt(roundsFired),
        rangeName: rangeName || null,
        rangeLocation: rangeLocation || null,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        firearm: { select: { id: true, name: true } },
        build: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST /api/range-sessions error:", error);
    return NextResponse.json({ error: "Failed to create range session" }, { status: 500 });
  }
}
