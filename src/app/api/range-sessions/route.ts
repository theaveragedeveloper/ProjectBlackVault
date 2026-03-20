import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardCaches } from "@/lib/server/dashboard";
import { requireAuth } from "@/lib/server/auth";

type FirearmPayload = {
  firearmId?: unknown;
  roundsFired?: unknown;
  buildId?: unknown;
};

const firearmInclude = {
  sessionFirearms: {
    include: {
      firearm: { select: { id: true, name: true, caliber: true } },
      build: { select: { id: true, name: true } },
    }
  },
};

// GET /api/range-sessions - List range sessions, optional ?firearmId= filter, ?include=analytics
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const limitRaw = parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
    const includeAnalytics = searchParams.get("include") === "analytics";

    const sessions = await prisma.rangeSession.findMany({
      where: firearmId ? { sessionFirearms: { some: { firearmId } } } : undefined,
      include: {
        ...firearmInclude,
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
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const body = await request.json();
    const {
      firearms,
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
      // Drill results
      drills,
    } = body;

    if (!Array.isArray(firearms) || firearms.length === 0) {
      return NextResponse.json({ error: "At least one firearm entry is required" }, { status: 400 });
    }

    const parsedFirearms = (firearms as FirearmPayload[]).map((entry) => ({
      firearmId: typeof entry.firearmId === "string" ? entry.firearmId : "",
      buildId: typeof entry.buildId === "string" && entry.buildId ? entry.buildId : null,
      roundsFired: parseInt(String(entry.roundsFired), 10),
    }));

    if (parsedFirearms.some((entry) => !entry.firearmId || !Number.isFinite(entry.roundsFired) || entry.roundsFired <= 0)) {
      return NextResponse.json(
        { error: "Each firearm entry must include firearmId and a roundsFired value greater than 0" },
        { status: 400 }
      );
    }

    // Validate that all referenced firearm IDs exist
    const firearmIds = [...new Set(parsedFirearms.map((entry) => entry.firearmId))];
    const existingFirearms = await prisma.firearm.findMany({
      where: { id: { in: firearmIds } },
      select: { id: true },
    });
    if (existingFirearms.length !== firearmIds.length) {
      const existingIds = new Set(existingFirearms.map((f) => f.id));
      const missingIds = firearmIds.filter((id) => !existingIds.has(id));
      return NextResponse.json(
        { error: `Referenced firearm(s) not found: ${missingIds.join(", ")}` },
        { status: 400 }
      );
    }

    const rounds = parsedFirearms.reduce((sum, entry) => sum + entry.roundsFired, 0);

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
          sessionFirearms: {
            create: parsedFirearms,
          },
        },
        include: firearmInclude,
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

      if (Array.isArray(drills) && drills.length > 0) {
        for (let i = 0; i < drills.length; i += 1) {
          const drill = drills[i] as Record<string, unknown>;
          const drillName =
            typeof drill.drillName === "string" ? drill.drillName.trim() : "";
          if (!drillName) continue;

          await tx.sessionDrill.create({
            data: {
              sessionId: created.id,
              templateId:
                typeof drill.templateId === "string" && drill.templateId
                  ? drill.templateId
                  : null,
              drillName: drillName.slice(0, 200),
              timeSeconds: parseFloat_(drill.timeSeconds),
              hits: parseInt_(drill.hits),
              totalShots: parseInt_(drill.totalShots),
              accuracy: parseFloat_(drill.accuracy),
              score: parseFloat_(drill.score),
              notes:
                typeof drill.notes === "string" && drill.notes.trim()
                  ? drill.notes.trim().slice(0, 1000)
                  : null,
              sortOrder: i,
            },
          });
        }
      }

      return created;
    });

    revalidateDashboardCaches(["range", "ammo"]);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST /api/range-sessions error:", error);
    return NextResponse.json({ error: "Failed to create range session" }, { status: 500 });
  }
}
