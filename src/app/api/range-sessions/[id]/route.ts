import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardCaches } from "@/lib/server/dashboard";

// GET /api/range-sessions/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.rangeSession.findUnique({
      where: { id },
      include: {
        sessionFirearms: {
          include: {
            firearm: { select: { id: true, name: true, caliber: true } },
            build: { select: { id: true, name: true } },
          },
        },
        sessionDrills: {
          include: { template: true },
          orderBy: { sortOrder: "asc" },
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
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const primaryFirearm = session.sessionFirearms[0] ?? null;
    return NextResponse.json({
      ...session,
      roundsFired: session.sessionFirearms.reduce((sum, sf) => sum + sf.roundsFired, 0),
      firearm: primaryFirearm?.firearm ?? null,
      build: primaryFirearm?.build ?? null,
    });
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
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      buildId,
      roundsFired,
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
      const existing = await tx.rangeSessionFirearm.findFirst({
        where: { sessionId: id },
        select: { id: true },
      });

      await tx.rangeSession.update({
        where: { id },
        data: {
          rangeName: typeof rangeName === "string" ? rangeName.slice(0, 200) : null,
          rangeLocation: typeof rangeLocation === "string" ? rangeLocation.slice(0, 200) : null,
          notes: typeof notes === "string" ? notes.slice(0, 5000) : null,
          date: date ? new Date(date) : undefined,
          environment: typeof environment === "string" ? environment : null,
          temperatureF: parseFloat_(temperatureF),
          windSpeedMph: parseFloat_(windSpeedMph),
          windDirection: typeof windDirection === "string" && windDirection ? windDirection : null,
          humidity: parseFloat_(humidity),
          lightCondition: typeof lightCondition === "string" ? lightCondition : null,
          weatherNotes: typeof weatherNotes === "string" && weatherNotes ? weatherNotes.slice(0, 1000) : null,
          targetDistanceYd: parseFloat_(targetDistanceYd),
          groupSizeIn: parseFloat_(groupSizeIn),
          groupSizeMoa: parseFloat_(groupSizeMoa),
          numberOfGroups: parseInt_(numberOfGroups),
          groupNotes: typeof groupNotes === "string" && groupNotes ? groupNotes.slice(0, 1000) : null,
        },
        include: {
          sessionFirearms: {
            include: {
              firearm: { select: { id: true, name: true, caliber: true } },
              build: { select: { id: true, name: true } },
            },
          },
          sessionDrills: { include: { template: true }, orderBy: { sortOrder: "asc" } },
          ammoLinks: {
            include: {
              transaction: {
                include: {
                  stock: { select: { caliber: true, brand: true, grainWeight: true, bulletType: true } },
                },
              },
            },
          },
        },
      });

      if (existing && (roundsFired !== undefined || buildId !== undefined)) {
        await tx.rangeSessionFirearm.update({
          where: { id: existing.id },
          data: {
            roundsFired: roundsFired !== undefined ? parseInt(String(roundsFired), 10) : undefined,
            buildId: buildId !== undefined ? (buildId || null) : undefined,
          },
        });
      }

      // Update ammo links if provided
      if (Array.isArray(ammoTransactionIds)) {
        await tx.sessionAmmoLink.deleteMany({ where: { sessionId: id } });
        for (const transactionId of ammoTransactionIds as string[]) {
          await tx.sessionAmmoLink.create({ data: { sessionId: id, transactionId } });
        }
      }

      return tx.rangeSession.findUniqueOrThrow({
        where: { id },
        include: {
          sessionFirearms: {
            include: {
              firearm: { select: { id: true, name: true, caliber: true } },
              build: { select: { id: true, name: true } },
            },
          },
          sessionDrills: { include: { template: true }, orderBy: { sortOrder: "asc" } },
          ammoLinks: {
            include: {
              transaction: {
                include: {
                  stock: { select: { caliber: true, brand: true, grainWeight: true, bulletType: true } },
                },
              },
            },
          },
        },
      });
    });

    revalidateDashboardCaches(["range", "ammo"]);

    const primaryFirearm = session.sessionFirearms[0] ?? null;
    return NextResponse.json({
      ...session,
      roundsFired: session.sessionFirearms.reduce((sum, sf) => sum + sf.roundsFired, 0),
      firearm: primaryFirearm?.firearm ?? null,
      build: primaryFirearm?.build ?? null,
    });
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
