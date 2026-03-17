import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardCaches } from "@/lib/server/dashboard";
import { requireAuth } from "@/lib/server/auth";

type FirearmPayload = {
  firearmId?: unknown;
  roundsFired?: unknown;
  buildId?: unknown;
};

const sessionInclude = {
  sessionFirearms: {
    include: {
      firearm: { select: { id: true, name: true, caliber: true } },
      build: { select: { id: true, name: true } },
    },
  },
  sessionDrills: {
    include: { template: true },
    orderBy: { sortOrder: "asc" as const },
  },
  ammoLinks: {
    include: {
      transaction: {
        include: {
          stock: { select: { caliber: true, brand: true, grainWeight: true, bulletType: true } },
        },
      },
    },
  },
};

// GET /api/range-sessions/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const session = await prisma.rangeSession.findUnique({
      where: { id },
      include: sessionInclude,
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("GET /api/range-sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

// PUT /api/range-sessions/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      firearms,
      rangeName,
      rangeLocation,
      notes,
      date,
      environment,
      temperatureF,
      windSpeedMph,
      windDirection,
      humidity,
      lightCondition,
      weatherNotes,
      targetDistanceYd,
      groupSizeIn,
      groupSizeMoa,
      numberOfGroups,
      groupNotes,
      ammoTransactionIds,
    } = body;

    const parseFloat_ = (v: unknown) => {
      if (v === undefined) return undefined;
      if (v === null || v === "") return null;
      const n = parseFloat(String(v));
      return Number.isFinite(n) ? n : undefined;
    };
    const parseInt_ = (v: unknown) => {
      if (v === undefined) return undefined;
      if (v === null || v === "") return null;
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : undefined;
    };
    const parseDate_ = (v: unknown): { value: Date | null | undefined; invalid: boolean } => {
      if (v === undefined) return { value: undefined, invalid: false };
      if (v === null || v === "") return { value: null, invalid: false };
      const parsed = new Date(String(v));
      if (Number.isNaN(parsed.getTime())) return { value: undefined, invalid: true };
      return { value: parsed, invalid: false };
    };
    const parseOptionalString = (v: unknown, maxLength?: number) => {
      if (v === undefined) return undefined;
      if (v === null || v === "") return null;
      if (typeof v !== "string") return undefined;
      const value = maxLength ? v.slice(0, maxLength) : v;
      return value;
    };

    let parsedFirearms: { firearmId: string; buildId: string | null; roundsFired: number }[] | null = null;
    const parsedDate = parseDate_(date);

    if (parsedDate.invalid) {
      return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
    }

    if (firearms !== undefined) {
      if (!Array.isArray(firearms) || firearms.length === 0) {
        return NextResponse.json({ error: "At least one firearm entry is required" }, { status: 400 });
      }
      parsedFirearms = (firearms as FirearmPayload[]).map((entry) => ({
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
    }

    const session = await prisma.$transaction(async (tx) => {
      const updated = await tx.rangeSession.update({
        where: { id },
        data: {
          rangeName: parseOptionalString(rangeName, 200),
          rangeLocation: parseOptionalString(rangeLocation, 200),
          notes: parseOptionalString(notes, 5000),
          date: parsedDate.value ?? undefined,
          environment: parseOptionalString(environment),
          temperatureF: parseFloat_(temperatureF),
          windSpeedMph: parseFloat_(windSpeedMph),
          windDirection: parseOptionalString(windDirection),
          humidity: parseFloat_(humidity),
          lightCondition: parseOptionalString(lightCondition),
          weatherNotes: parseOptionalString(weatherNotes, 1000),
          targetDistanceYd: parseFloat_(targetDistanceYd),
          groupSizeIn: parseFloat_(groupSizeIn),
          groupSizeMoa: parseFloat_(groupSizeMoa),
          numberOfGroups: parseInt_(numberOfGroups),
          groupNotes: parseOptionalString(groupNotes, 1000),
        },
      });

      if (parsedFirearms) {
        await tx.sessionFirearm.deleteMany({ where: { sessionId: id } });
        await tx.sessionFirearm.createMany({
          data: parsedFirearms.map((entry) => ({
            sessionId: id,
            firearmId: entry.firearmId,
            buildId: entry.buildId,
            roundsFired: entry.roundsFired,
          })),
        });
      }

      // Update ammo links if provided
      if (Array.isArray(ammoTransactionIds)) {
        await tx.sessionAmmoLink.deleteMany({ where: { sessionId: id } });
        for (const transactionId of ammoTransactionIds as string[]) {
          await tx.sessionAmmoLink.create({ data: { sessionId: id, transactionId } });
        }
      }

      return updated;
    });

    const hydrated = await prisma.rangeSession.findUnique({ where: { id: session.id }, include: sessionInclude });

    revalidateDashboardCaches(["range", "ammo"]);

    return NextResponse.json(hydrated);
  } catch (error) {
    console.error("PUT /api/range-sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

// DELETE /api/range-sessions/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    await prisma.rangeSession.delete({ where: { id } });

    revalidateDashboardCaches(["range", "ammo"]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/range-sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
