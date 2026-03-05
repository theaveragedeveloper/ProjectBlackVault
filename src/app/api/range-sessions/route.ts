import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/range-sessions - List range sessions, optional ?firearmId= filter, ?include=analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const limitRaw = parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
    const includeAnalytics = searchParams.get("include") === "analytics";

    const sessions = await prisma.rangeSession.findMany({
      where: firearmId ? { firearmId } : undefined,
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
        build: { select: { id: true, name: true } },
        _count: { select: { sessionDrills: true } },
        ...(includeAnalytics
          ? {
              sessionDrills: {
                select: { accuracy: true, drillName: true, templateId: true, timeSeconds: true, score: true },
              },
            }
          : {}),
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
    const {
      firearmId,
      buildId,
      roundsFired,
      rangeName,
      rangeLocation,
      notes,
      date,
      // Environment
      environment,
      temperatureF,
      windSpeedMph,
      windDirection,
      humidity,
      lightCondition,
      weatherNotes,
      // Shot groups
      targetDistanceYd,
      groupSizeIn,
      groupSizeMoa,
      numberOfGroups,
      groupNotes,
      // Ammo links
      ammoTransactionIds,
    } = body;

    if (!firearmId || roundsFired === undefined || roundsFired === null) {
      return NextResponse.json(
        { error: "Missing required fields: firearmId, roundsFired" },
        { status: 400 }
      );
    }

    const rounds = parseInt(String(roundsFired), 10);
    if (!Number.isFinite(rounds) || rounds < 0) {
      return NextResponse.json({ error: "roundsFired must be a non-negative integer" }, { status: 400 });
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

    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.rangeSession.create({
        data: {
          firearmId,
          buildId: buildId || null,
          roundsFired: rounds,
          rangeName: typeof rangeName === "string" ? rangeName.slice(0, 200) : null,
          rangeLocation: typeof rangeLocation === "string" ? rangeLocation.slice(0, 200) : null,
          notes: typeof notes === "string" ? notes.slice(0, 5000) : null,
          date: date ? new Date(date) : new Date(),
          // environment
          environment: typeof environment === "string" ? environment : null,
          temperatureF: parseFloat_(temperatureF),
          windSpeedMph: parseFloat_(windSpeedMph),
          windDirection: typeof windDirection === "string" && windDirection ? windDirection : null,
          humidity: parseFloat_(humidity),
          lightCondition: typeof lightCondition === "string" ? lightCondition : null,
          weatherNotes: typeof weatherNotes === "string" && weatherNotes ? weatherNotes.slice(0, 1000) : null,
          // shot groups
          targetDistanceYd: parseFloat_(targetDistanceYd),
          groupSizeIn: parseFloat_(groupSizeIn),
          groupSizeMoa: parseFloat_(groupSizeMoa),
          numberOfGroups: parseInt_(numberOfGroups),
          groupNotes: typeof groupNotes === "string" && groupNotes ? groupNotes.slice(0, 1000) : null,
        },
        include: {
          firearm: { select: { id: true, name: true, caliber: true } },
          build: { select: { id: true, name: true } },
        },
      });

      if (Array.isArray(ammoTransactionIds) && ammoTransactionIds.length > 0) {
        for (const transactionId of ammoTransactionIds as string[]) {
          await tx.sessionAmmoLink.upsert({
            where: { sessionId_transactionId: { sessionId: created.id, transactionId } },
            create: { sessionId: created.id, transactionId },
            update: {},
          });
        }
      }

      return created;
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST /api/range-sessions error:", error);
    return NextResponse.json({ error: "Failed to create range session" }, { status: 500 });
  }
}
