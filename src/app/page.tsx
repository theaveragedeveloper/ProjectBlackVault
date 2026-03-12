import { getDashboardAggregates } from "@/lib/server/dashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

async function getDashboardData() {
  const data = await getDashboardAggregates();

  return {
    firearmCount: data.firearmCount,
    accessoryCount: data.accessoryCount,
    totalAmmoRounds: data.totalAmmoRounds,
    totalInvestment: data.totalInvestment,
    lowStockItems: data.lowStockItems,
    recentFirearms: data.recentFirearms,
    ammoStocks: data.ammoStocks,
    maintenanceDue: data.maintenanceDue,
    rangeStats: data.rangeStats,
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
