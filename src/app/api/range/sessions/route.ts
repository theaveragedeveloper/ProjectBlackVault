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

export async function GET() {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const sessions = await prisma.rangeSession.findMany({
      include: {
        firearm: {
          select: {
            id: true,
            name: true,
            caliber: true,
          },
        },
        build: {
          select: {
            id: true,
            name: true,
          },
        },
        ammoLinks: {
          include: {
            ammoStock: {
              select: {
                id: true,
                caliber: true,
                brand: true,
                grainWeight: true,
                bulletType: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        sessionDrills: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { setNumber: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ sessionDate: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/range/sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch range sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const body = await request.json();
    const { sessionDate, location, firearmId, buildId, roundsFired, notes, ammoLinks, sessionDrills } = body;

    const normalizedAmmoLinks = (Array.isArray(ammoLinks) ? ammoLinks : [])
      .map((link) => ({
        ammoStockId: typeof link?.ammoStockId === "string" ? link.ammoStockId : "",
        roundsUsed: link?.roundsUsed,
      }))
      .filter((link) => link.ammoStockId && typeof link.roundsUsed === "number" && Number.isInteger(link.roundsUsed) && link.roundsUsed > 0);

    for (const link of normalizedAmmoLinks) {
      if (typeof link.roundsUsed !== "number" || !Number.isInteger(link.roundsUsed) || link.roundsUsed < 0) {
        return NextResponse.json({ error: "Each ammo link must include a non-negative integer roundsUsed value" }, { status: 400 });
      }
    }

    const uniqueAmmoStockIds = new Set(normalizedAmmoLinks.map((item) => item.ammoStockId));
    if (uniqueAmmoStockIds.size !== normalizedAmmoLinks.length) {
      return NextResponse.json(
        { error: "Duplicate ammo selections are not allowed in a single session" },
        { status: 400 }
      );
    }

    const totalAmmoRounds = normalizedAmmoLinks.reduce((sum, item) => sum + item.roundsUsed, 0);
    const resolvedRoundsFired = typeof roundsFired === "number" && Number.isInteger(roundsFired) && roundsFired >= 0
      ? roundsFired
      : totalAmmoRounds;
    const normalizedSessionDrills = Array.isArray(sessionDrills)
      ? sessionDrills.flatMap((entry, index) => {
        const name = typeof entry?.name === "string" ? entry.name.trim() : "";
        const timeSeconds = typeof entry?.timeSeconds === "number" ? entry.timeSeconds : NaN;
        const points = typeof entry?.points === "number" ? entry.points : NaN;
        const penaltiesValue = entry?.penalties;
        const hitsValue = entry?.hits;
        const sortOrderValue = entry?.sortOrder;
        const setNumberValue = entry?.setNumber;

        if (!name || !Number.isFinite(timeSeconds) || timeSeconds <= 0 || !Number.isFinite(points) || points < 0) {
          return [];
        }

        const penalties = typeof penaltiesValue === "number" && Number.isFinite(penaltiesValue) && penaltiesValue >= 0
          ? penaltiesValue
          : null;
        const hits = typeof hitsValue === "number" && Number.isInteger(hitsValue) && hitsValue >= 0
          ? hitsValue
          : null;
        const sortOrder = typeof sortOrderValue === "number" && Number.isInteger(sortOrderValue)
          ? sortOrderValue
          : index;
        const setNumber = typeof setNumberValue === "number" && Number.isInteger(setNumberValue) && setNumberValue > 0
          ? setNumberValue
          : null;
        const adjustedPoints = Math.max(0, points - (penalties ?? 0));

        return [{
          name,
          timeSeconds,
          points,
          penalties,
          hits,
          notes: typeof entry?.notes === "string" ? entry.notes.trim() || null : null,
          sortOrder,
          setNumber,
          hitFactor: calculateHitFactor(adjustedPoints, timeSeconds),
        }];
      })
      : [];

    const setCounterByDrillName = new Map<string, number>();
    for (const drillEntry of normalizedSessionDrills) {
      const nextCounter = (setCounterByDrillName.get(drillEntry.name) ?? 0) + 1;
      setCounterByDrillName.set(drillEntry.name, nextCounter);
      if (drillEntry.setNumber == null) {
        drillEntry.setNumber = nextCounter;
      }
    }

    const parsedDate = (() => {
      if (typeof sessionDate !== "string" || sessionDate.trim().length === 0) return new Date();
      const parsed = new Date(sessionDate);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    })();

    const resolvedLocation = typeof location === "string" && location.trim().length > 0
      ? location.trim()
      : "Unspecified location";

    const resolvedFirearmId = typeof firearmId === "string" && firearmId
      ? firearmId
      : (await prisma.firearm.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }))?.id;

    if (!resolvedFirearmId) {
      return NextResponse.json({ error: "No firearm available to log this session" }, { status: 400 });
    }

    const resolvedBuildId = typeof buildId === "string" && buildId ? buildId : null;

    const firearm = await prisma.firearm.findUnique({
      where: { id: resolvedFirearmId },
      select: { id: true, caliber: true },
    });
    const build = resolvedBuildId
      ? await prisma.build.findUnique({ where: { id: resolvedBuildId }, select: { id: true, firearmId: true } })
      : null;
    const ammoStocks = await prisma.ammoStock.findMany({
      where: {
        id: { in: normalizedAmmoLinks.map((item) => item.ammoStockId) },
      },
      select: { id: true, caliber: true, quantity: true, brand: true },
    });

    if (!firearm) {
      return NextResponse.json({ error: "Firearm not found" }, { status: 404 });
    }

    if (resolvedBuildId && !build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    if (build && build.firearmId !== resolvedFirearmId) {
      return NextResponse.json(
        { error: "Selected build does not belong to the selected firearm" },
        { status: 400 }
      );
    }

    if (ammoStocks.length !== normalizedAmmoLinks.length) {
      return NextResponse.json({ error: "One or more ammo selections are invalid" }, { status: 400 });
    }

    for (const ammoLink of normalizedAmmoLinks) {
      const stock = ammoStocks.find((item) => item.id === ammoLink.ammoStockId);
      if (!stock) {
        return NextResponse.json({ error: "One or more ammo selections are invalid" }, { status: 400 });
      }

      if (stock.caliber !== firearm.caliber) {
        return NextResponse.json(
          { error: `Selected ammo must match firearm caliber (${firearm.caliber})` },
          { status: 400 }
        );
      }

      if (stock.quantity < ammoLink.roundsUsed) {
        return NextResponse.json(
          { error: `Insufficient ammo stock for ${stock.brand}. Available: ${stock.quantity}` },
          { status: 400 }
        );
      }
    }

    const created = await prisma.rangeSession.create({
      data: {
        sessionDate: parsedDate,
        location: resolvedLocation,
        firearmId: resolvedFirearmId,
        buildId: resolvedBuildId,
        roundsFired: resolvedRoundsFired,
        notes: typeof notes === "string" ? notes.trim() || null : null,
        ammoLinks: {
          create: normalizedAmmoLinks,
        },
        sessionDrills: {
          create: normalizedSessionDrills.map((entry) => ({
            name: entry.name,
            setNumber: entry.setNumber ?? 1,
            timeSeconds: entry.timeSeconds,
            points: entry.points,
            penalties: entry.penalties,
            hits: entry.hits,
            notes: entry.notes,
            hitFactor: entry.hitFactor,
            sortOrder: entry.sortOrder,
          })),
        },
      },
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
        build: { select: { id: true, name: true } },
        ammoLinks: {
          include: {
            ammoStock: {
              select: {
                id: true,
                caliber: true,
                brand: true,
                grainWeight: true,
                bulletType: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        sessionDrills: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { setNumber: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/range/sessions error:", error);
    return NextResponse.json({ error: "Failed to create range session" }, { status: 500 });
  }
}
