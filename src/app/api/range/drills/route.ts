import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

function calculateHitFactor(points: number, timeSeconds: number): number {
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) return 0;
  if (!Number.isFinite(points) || points < 0) return 0;
  return Number((points / timeSeconds).toFixed(4));
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  const drillName = request.nextUrl.searchParams.get("name")?.trim();
  const where = drillName ? { name: drillName } : undefined;

  const drills = await prisma.sessionDrill.findMany({
    where,
    include: {
      rangeSession: {
        select: {
          id: true,
          sessionDate: true,
          location: true,
          firearm: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json(drills);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  const body = await request.json();
  const { name, timeSeconds, points, penalties, hits, notes } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing drill name" }, { status: 400 });
  }

  if (typeof timeSeconds !== "number" || !Number.isFinite(timeSeconds) || timeSeconds <= 0) {
    return NextResponse.json({ error: "timeSeconds must be a positive number" }, { status: 400 });
  }

  if (typeof points !== "number" || !Number.isFinite(points) || points < 0) {
    return NextResponse.json({ error: "points must be a non-negative number" }, { status: 400 });
  }

  const adjustedPoints = Math.max(0, points - (typeof penalties === "number" ? penalties : 0));

  const defaultFirearm = await prisma.firearm.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
  if (!defaultFirearm) {
    return NextResponse.json({ error: "Add at least one firearm in the vault before logging drills." }, { status: 400 });
  }

  const drill = await prisma.sessionDrill.create({
    data: {
      name: name.trim(),
      setNumber: 1,
      timeSeconds,
      points,
      penalties: typeof penalties === "number" ? penalties : null,
      hits: typeof hits === "number" ? hits : null,
      hitFactor: calculateHitFactor(adjustedPoints, timeSeconds),
      notes: typeof notes === "string" ? notes.trim() || null : null,
      sortOrder: 0,
      rangeSession: {
        create: {
          sessionDate: new Date(),
          location: "Drill-only entry",
          roundsFired: 0,
          firearm: {
            connect: {
              id: defaultFirearm.id,
            },
          },
        },
      },
    },
    include: {
      rangeSession: { select: { id: true, sessionDate: true, location: true } },
    },
  });

  return NextResponse.json(drill, { status: 201 });
}
