import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const DASHBOARD_CACHE_TAGS = {
  all: "dashboard:all",
  firearms: "dashboard:firearms",
  accessories: "dashboard:accessories",
  ammo: "dashboard:ammo",
  range: "dashboard:range",
} as const;

export const DASHBOARD_MUTATION_TAGS = [
  DASHBOARD_CACHE_TAGS.all,
  DASHBOARD_CACHE_TAGS.firearms,
  DASHBOARD_CACHE_TAGS.accessories,
  DASHBOARD_CACHE_TAGS.ammo,
  DASHBOARD_CACHE_TAGS.range,
] as const;

async function getDashboardAggregatesUncached() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    firearmCount,
    accessoryCount,
    ammoStocks,
    firearms,
    accessories,
    recentFirearms,
    recentAccessories,
    recentAmmo,
    rangeSessionCount,
    rangeSessionFirearmAggregate,
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
        updatedAt: true,
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
    prisma.accessory.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        manufacturer: true,
        type: true,
        imageUrl: true,
        createdAt: true,
      },
    }),
    prisma.ammoStock.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        caliber: true,
        brand: true,
        quantity: true,
        updatedAt: true,
      },
    }),
    prisma.rangeSession.count(),
    prisma.rangeSessionFirearm.aggregate({
      _sum: { roundsFired: true },
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
        sessionFirearms: {
          take: 1,
          select: {
            roundsFired: true,
            firearm: { select: { name: true } },
          },
        },
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
    prisma.rangeSessionFirearm.groupBy({
      by: ["firearmId"],
      _sum: { roundsFired: true },
    }),
  ]);

  const ammoByCaliber: Record<
    string,
    { caliber: string; totalRounds: number; stockCount: number; lowStock: boolean }
  > = {};

  let totalAmmoRounds = 0;
  for (const stock of ammoStocks) {
    totalAmmoRounds += stock.quantity;
    if (!ammoByCaliber[stock.caliber]) {
      ammoByCaliber[stock.caliber] = {
        caliber: stock.caliber,
        totalRounds: 0,
        stockCount: 0,
        lowStock: false,
      };
    }
    ammoByCaliber[stock.caliber].totalRounds += stock.quantity;
    ammoByCaliber[stock.caliber].stockCount += 1;
    if (stock.lowStockAlert != null && stock.quantity <= stock.lowStockAlert) {
      ammoByCaliber[stock.caliber].lowStock = true;
    }
  }

  const totalFirearmInvestment = firearms.reduce((sum, f) => sum + (f.purchasePrice ?? 0), 0);
  const totalFirearmCurrentValue = firearms.reduce(
    (sum, f) => sum + (f.currentValue ?? f.purchasePrice ?? 0),
    0
  );
  const totalAccessoryInvestment = accessories.reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0);
  const totalInvestment = totalFirearmInvestment + totalAccessoryInvestment;
  const totalCurrentValue = totalFirearmCurrentValue + totalAccessoryInvestment;
  const unrealizedGainLoss = totalCurrentValue - totalInvestment;

  const lowStockItems = ammoStocks.filter(
    (s) => s.lowStockAlert != null && s.quantity <= s.lowStockAlert
  );

  const roundsByFirearm = new Map<string, number>();
  for (const row of roundsPerFirearmRaw) {
    roundsByFirearm.set(row.firearmId, row._sum.roundsFired ?? 0);
  }

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
      const daysUntilDue =
        base && a.batteryIntervalDays
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
    .filter(
      (item) =>
        item.overdue ||
        (item.daysUntilDue != null && item.daysUntilDue <= 60) ||
        (item.roundsUntilDue != null && item.roundsUntilDue <= 500)
    )
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
    ammoStocks,
    ammoByCaliber: Object.values(ammoByCaliber).sort((a, b) => a.caliber.localeCompare(b.caliber)),
    recentFirearms,
    recentAccessories,
    recentAmmo,
    lowStockItems,
    totalAmmoRounds,
    totalInvestment,
    totalCurrentValue,
    unrealizedGainLoss,
    totalFirearmInvestment,
    totalFirearmCurrentValue,
    totalAccessoryInvestment,
    maintenanceDue,
    rangeStats: {
      count: rangeSessionCount,
      totalRounds: rangeSessionFirearmAggregate._sum.roundsFired ?? 0,
      sessionsLast30Days: rangeSessionsLast30,
      lastSession: lastRangeSession
        ? {
            id: lastRangeSession.id,
            date: lastRangeSession.date,
            rangeName: lastRangeSession.rangeName,
            roundsFired: lastRangeSession.sessionFirearms[0]?.roundsFired ?? 0,
            firearmName: lastRangeSession.sessionFirearms[0]?.firearm.name ?? "Unknown",
          }
        : null,
    },
  };
}

export const getDashboardAggregates = unstable_cache(getDashboardAggregatesUncached, ["dashboard-aggregates-v1"], {
  revalidate: 30,
  tags: [...DASHBOARD_MUTATION_TAGS],
});

export function revalidateDashboardCaches(domains: Array<keyof typeof DASHBOARD_CACHE_TAGS> = ["all"]) {
  const uniqueTags = new Set<string>([DASHBOARD_CACHE_TAGS.all]);
  for (const domain of domains) {
    uniqueTags.add(DASHBOARD_CACHE_TAGS[domain]);
  }
  for (const tag of uniqueTags) {
    revalidateTag(tag);
  }
}
