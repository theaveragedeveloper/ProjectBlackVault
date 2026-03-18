import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

async function getDashboardData() {
  const [
    firearmCount,
    accessoryCount,
    ammoStocks,
    firearms,
    accessories,
    recentFirearms,
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
