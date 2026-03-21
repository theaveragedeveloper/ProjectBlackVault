import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDashboardData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
    dueMaintenanceNotes,
    batteryCandidates,
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
    prisma.maintenanceNote.findMany({
      where: { dueDate: { not: null, lte: now } },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        type: true,
        description: true,
        dueDate: true,
        firearm: { select: { id: true, name: true } },
      },
      take: 20,
    }),
    prisma.accessory.findMany({
      where: {
        hasBattery: true,
        batteryReplacementIntervalDays: { not: null },
        lastBatteryChangeDate: { not: null },
      },
      select: {
        id: true,
        name: true,
        batteryType: true,
        batteryReplacementIntervalDays: true,
        lastBatteryChangeDate: true,
        buildSlots: {
          select: {
            build: {
              select: {
                firearm: { select: { id: true, name: true } },
              },
            },
          },
        },
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

  const maintenanceDueItems = dueMaintenanceNotes.map((note) => ({
    id: `maint:${note.id}`,
    kind: "maintenance" as const,
    title: note.type,
    description: note.description,
    dueDate: note.dueDate!.toISOString(),
    overdue: note.dueDate!.getTime() < todayStart.getTime(),
    firearmId: note.firearm.id,
    firearmName: note.firearm.name,
  }));

  const batteryDueItems = batteryCandidates
    .flatMap((accessory) => {
      const intervalDays = accessory.batteryReplacementIntervalDays;
      const lastChange = accessory.lastBatteryChangeDate;
      if (!intervalDays || !lastChange) return [];

      const dueDate = new Date(
        lastChange.getTime() + intervalDays * 24 * 60 * 60 * 1000
      );
      const dueDateStart = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      );
      if (dueDateStart.getTime() > todayStart.getTime()) return [];

      const linkedFirearm = accessory.buildSlots[0]?.build.firearm ?? null;

      return [
        {
          id: `battery:${accessory.id}`,
          kind: "battery" as const,
          title: accessory.name,
          description: accessory.batteryType
            ? `Battery change (${accessory.batteryType})`
            : "Battery change",
          dueDate: dueDate.toISOString(),
          overdue: dueDateStart.getTime() < todayStart.getTime(),
          accessoryId: accessory.id,
          firearmId: linkedFirearm?.id ?? null,
          firearmName: linkedFirearm?.name ?? null,
        },
      ];
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const seenTaskIds = new Set<string>();
  const maintenanceItems = [...maintenanceDueItems, ...batteryDueItems]
    .filter((item) => {
      if (seenTaskIds.has(item.id)) return false;
      seenTaskIds.add(item.id);
      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 20);

  return {
    firearmCount,
    accessoryCount,
    totalAmmoRounds,
    totalInvestment,
    lowStockItems,
    recentFirearms,
    ammoStocks,
    maintenanceItems,
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
