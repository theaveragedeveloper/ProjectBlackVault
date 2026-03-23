import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
  try {
    const body = await request.json();
    const { sessionDate, location, firearmId, buildId, roundsFired, notes, ammoLinks } = body;

    if (!sessionDate || !location || !firearmId || roundsFired === undefined || roundsFired === null) {
      return NextResponse.json(
        { error: "Missing required fields: sessionDate, location, firearmId, roundsFired" },
        { status: 400 }
      );
    }

    if (typeof location !== "string" || location.trim().length === 0) {
      return NextResponse.json({ error: "location must be a non-empty string" }, { status: 400 });
    }

    if (typeof roundsFired !== "number" || !Number.isInteger(roundsFired) || roundsFired <= 0) {
      return NextResponse.json({ error: "roundsFired must be a positive integer" }, { status: 400 });
    }

    const parsedDate = new Date(sessionDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "sessionDate must be a valid date" }, { status: 400 });
    }

    if (!Array.isArray(ammoLinks) || ammoLinks.length === 0) {
      return NextResponse.json(
        { error: "At least one ammo selection is required" },
        { status: 400 }
      );
    }

    const normalizedAmmoLinks = ammoLinks
      .map((link) => ({
        ammoStockId: typeof link?.ammoStockId === "string" ? link.ammoStockId : "",
        roundsUsed: link?.roundsUsed,
      }))
      .filter((link) => link.ammoStockId);

    if (normalizedAmmoLinks.length === 0) {
      return NextResponse.json({ error: "ammoLinks contain no valid ammoStockId values" }, { status: 400 });
    }

    for (const link of normalizedAmmoLinks) {
      if (typeof link.roundsUsed !== "number" || !Number.isInteger(link.roundsUsed) || link.roundsUsed <= 0) {
        return NextResponse.json(
          { error: "Each ammo link must include a positive integer roundsUsed value" },
          { status: 400 }
        );
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
    if (totalAmmoRounds !== roundsFired) {
      return NextResponse.json(
        { error: "Ammo rounds selected must match rounds fired" },
        { status: 400 }
      );
    }

    const firearm = await prisma.firearm.findUnique({
      where: { id: firearmId },
      select: { id: true, caliber: true },
    });
    const build = buildId
      ? await prisma.build.findUnique({ where: { id: buildId }, select: { id: true, firearmId: true } })
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

    if (buildId && !build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    if (build && build.firearmId !== firearmId) {
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
        location: location.trim(),
        firearmId,
        buildId: buildId ?? null,
        roundsFired,
        notes: typeof notes === "string" ? notes.trim() || null : null,
        ammoLinks: {
          create: normalizedAmmoLinks,
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
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/range/sessions error:", error);
    return NextResponse.json({ error: "Failed to create range session" }, { status: 500 });
  }
}
