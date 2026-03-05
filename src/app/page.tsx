import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

async function getDashboardData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    firearmCount,
    accessoryCount,
    ammoStocks,
    firearms,
    accessories,
    recentFirearms,
    rangeSessionAggregate,
    rangeSessionsLast30,
    lastRangeSession,
  ] = await Promise.all([
    prisma.firearm.count(),
    prisma.accessory.count(),
    prisma.ammoStock.findMany({
      select: {
        id: true,
        caliber: true,
        brand: true,
        quantity: true,
        purchasePrice: true,
        lowStockAlert: true,
        grainWeight: true,
        bulletType: true,
      },
    }),
    prisma.firearm.findMany({
      select: { id: true, purchasePrice: true, currentValue: true },
    }),
    prisma.accessory.findMany({
      select: { id: true, purchasePrice: true },
    }),
    prisma.firearm.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        manufacturer: true,
        model: true,
        type: true,
        caliber: true,
        imageUrl: true,
        acquisitionDate: true,
        createdAt: true,
      },
    }),
    prisma.rangeSession.aggregate({
      _sum: { roundsFired: true },
      _count: { id: true },
    }),
    prisma.rangeSession.count({
      where: { date: { gte: thirtyDaysAgo } },
    }),
    prisma.rangeSession.findFirst({
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        rangeName: true,
        roundsFired: true,
        firearm: { select: { name: true } },
      },
    }),
  ]);

  const totalAmmoRounds = ammoStocks.reduce((sum, s) => sum + s.quantity, 0);
  const totalFirearmInvestment = firearms.reduce((sum, f) => sum + (f.purchasePrice ?? 0), 0);
  const totalAccessoryInvestment = accessories.reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0);
  const totalInvestment = totalFirearmInvestment + totalAccessoryInvestment;

  const lowStockItems = ammoStocks.filter(
    (s) => s.lowStockAlert != null && s.quantity <= s.lowStockAlert
  );

  return {
    firearmCount,
    accessoryCount,
    totalAmmoRounds,
    totalInvestment,
    lowStockItems,
    recentFirearms,
    ammoStocks,
    rangeStats: {
      count: rangeSessionAggregate._count.id,
      totalRounds: rangeSessionAggregate._sum.roundsFired ?? 0,
      sessionsLast30Days: rangeSessionsLast30,
      lastSession: lastRangeSession
        ? {
            id: lastRangeSession.id,
            date: lastRangeSession.date,
            rangeName: lastRangeSession.rangeName,
            roundsFired: lastRangeSession.roundsFired,
            firearmName: lastRangeSession.firearm.name,
          }
        : null,
    },
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="tactical-grid min-h-full">
      <PageHeader
        title="COMMAND CENTER"
        subtitle="BlackVault Armory Platform — Tactical Inventory Overview"
      />
      <DashboardClient data={data} />
    </div>
  );
}
