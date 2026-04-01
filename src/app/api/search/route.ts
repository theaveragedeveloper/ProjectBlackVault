import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const rawQ = request.nextUrl.searchParams.get("q") ?? "";
  const q = rawQ.toLowerCase().trim();

  const empty = { firearms: [], accessories: [], ammo: [], builds: [] };

  if (q.length < 2) {
    return NextResponse.json(empty);
  }

  // Sequential queries — SQLite connection_limit=1
  const firearms = await prisma.firearm.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { manufacturer: { contains: q } },
        { model: { contains: q } },
        { caliber: { contains: q } },
      ],
    },
    take: 5,
    select: { id: true, name: true, manufacturer: true, model: true, caliber: true, type: true },
  });

  const accessories = await prisma.accessory.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { manufacturer: { contains: q } },
        { model: { contains: q } },
        { type: { contains: q } },
      ],
    },
    take: 5,
    select: { id: true, name: true, manufacturer: true, type: true },
  });

  const ammoStocks = await prisma.ammoStock.findMany({
    where: {
      OR: [
        { brand: { contains: q } },
        { caliber: { contains: q } },
        { bulletType: { contains: q } },
      ],
    },
    take: 5,
    select: { id: true, brand: true, caliber: true, grainWeight: true },
  });

  const builds = await prisma.build.findMany({
    where: { name: { contains: q } },
    take: 5,
    select: { id: true, name: true, firearmId: true },
  });

  return NextResponse.json({
    firearms: firearms.map((f) => ({
      id: f.id,
      name: f.name,
      subtitle: `${f.manufacturer} · ${f.caliber}`,
      url: `/vault/${f.id}`,
    })),
    accessories: accessories.map((a) => ({
      id: a.id,
      name: a.name,
      subtitle: `${a.manufacturer} · ${a.type}`,
      url: `/accessories/${a.id}`,
    })),
    ammo: ammoStocks.map((a) => ({
      id: a.id,
      name: `${a.brand} ${a.caliber}`,
      subtitle: a.grainWeight ? `${a.grainWeight}gr` : a.caliber,
      url: `/ammo`,
    })),
    builds: builds.map((b) => ({
      id: b.id,
      name: b.name,
      subtitle: "Build",
      url: `/vault/${b.firearmId}`,
    })),
  });
}
