import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardStats } from "@/lib/dashboard/get-dashboard-stats";
import { LanBanner } from "@/components/dashboard/LanBanner";

async function getDashboardData() {
  const stats = await getDashboardStats();

  return {
    firearmCount: stats.totals.firearms,
    accessoryCount: stats.totals.accessories,
    totalAmmoRounds: stats.totals.ammoRounds,
    totalInvestment: stats.investment.totalCost,
    lowStockItems: stats.ammo.stocks.filter(
      (stock) =>
        stock.lowStockAlert !== null &&
        stock.lowStockAlert !== undefined &&
        stock.quantity <= stock.lowStockAlert
    ),
    recentFirearms: stats.recent.firearms,
    ammoStocks: stats.ammo.stocks,
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
      <div className="px-4 sm:px-6 pt-4">
        <LanBanner />
      </div>
      <DashboardClient data={data} />
    </div>
  );
}
