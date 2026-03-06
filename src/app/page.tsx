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
    maintenanceSchedulesRaw,
    batteriesTracked,
    roundsPerFirearmRaw,
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
    prisma.maintenanceSchedule.findMany({
      include: { firearm: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.accessory.findMany({
      where: { hasBattery: true, batteryIntervalDays: { not: null } },
      select: { id: true, name: true, batteryChangedAt: true, batteryIntervalDays: true },
    }),
    prisma.rangeSession.groupBy({
      by: ["firearmId"],
      _sum: { roundsFired: true },
    }),
  ]);

  const totalAmmoRounds = ammoStocks.reduce((sum, s) => sum + s.quantity, 0);
  const totalFirearmInvestment = firearms.reduce((sum, f) => sum + (f.purchasePrice ?? 0), 0);
  const totalAccessoryInvestment = accessories.reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0);
  const totalInvestment = totalFirearmInvestment + totalAccessoryInvestment;

  const lowStockItems = ammoStocks.filter(
    (s) => s.lowStockAlert != null && s.quantity <= s.lowStockAlert
  );

  // Build a map of firearmId -> total rounds
  const roundsByFirearm = new Map<string, number>();
  for (const row of roundsPerFirearmRaw) {
    roundsByFirearm.set(row.firearmId, row._sum.roundsFired ?? 0);
  }

  // Compute due info for each maintenance schedule
  const now = Date.now();
  const maintenanceDue = [
    ...maintenanceSchedulesRaw.map((s) => {
      let daysUntilDue: number | null = null;
      let roundsUntilDue: number | null = null;
      let overdue = false;
      if (s.intervalType === "ROUNDS") {
        const currentRounds = roundsByFirearm.get(s.firearmId) ?? 0;
        const base = s.lastRoundCount ?? 0;
        const remaining = base + s.intervalValue - currentRounds;
        roundsUntilDue = remaining;
        overdue = remaining <= 0;
      } else {
        const base = s.lastCompletedAt ? new Date(s.lastCompletedAt) : new Date(s.createdAt);
        const nextDueMs = base.getTime() + s.intervalValue * 86400000;
        daysUntilDue = Math.ceil((nextDueMs - now) / 86400000);
        overdue = daysUntilDue <= 0;
      }
      return {
        id: s.id,
        type: "schedule" as const,
        name: s.taskName,
        entityName: s.firearm.name,
        entityId: s.firearmId,
        entityHref: `/vault/${s.firearmId}`,
        intervalType: s.intervalType as "ROUNDS" | "DAYS",
        daysUntilDue,
        roundsUntilDue,
        overdue,
      };
    }),
    ...batteriesTracked.map((a) => {
      const base = a.batteryChangedAt ? new Date(a.batteryChangedAt) : null;
      const daysUntilDue = base && a.batteryIntervalDays
        ? Math.ceil((base.getTime() + a.batteryIntervalDays * 86400000 - now) / 86400000)
        : null;
      return {
        id: `battery-${a.id}`,
        type: "battery" as const,
        name: "Battery Change",
        entityName: a.name,
        entityId: a.id,
        entityHref: `/accessories/${a.id}`,
        intervalType: "DAYS" as const,
        daysUntilDue,
        roundsUntilDue: null,
        overdue: daysUntilDue != null ? daysUntilDue <= 0 : false,
      };
    }),
  ]
    .filter((item) => item.overdue || (item.daysUntilDue != null && item.daysUntilDue <= 60) || (item.roundsUntilDue != null && item.roundsUntilDue <= 500))
    .sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      const aVal = a.daysUntilDue ?? (a.roundsUntilDue ?? 0);
      const bVal = b.daysUntilDue ?? (b.roundsUntilDue ?? 0);
      return aVal - bVal;
    });

  return {
    firearmCount,
    accessoryCount,
    totalAmmoRounds,
    totalInvestment,
    lowStockItems,
    recentFirearms,
    ammoStocks,
    maintenanceDue,
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
