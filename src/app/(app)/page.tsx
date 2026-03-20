import { getDashboardAggregates } from "@/lib/server/dashboard";

export const dynamic = 'force-dynamic';
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
    maintenanceItems: data.maintenanceDue.map((item) => ({
      id: item.id,
      kind: item.type === "battery" ? "battery" as const : "maintenance" as const,
      title: item.name,
      description: item.entityName,
      dueDate: item.daysUntilDue != null
        ? new Date(Date.now() + item.daysUntilDue * 86400000).toISOString()
        : new Date().toISOString(),
      overdue: item.overdue,
      firearmId: item.entityHref.startsWith("/vault/") ? item.entityId : null,
      accessoryId: item.entityHref.startsWith("/accessories/") ? item.entityId : null,
    })),
    rangeStats: data.rangeStats,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="tactical-grid min-h-full">
      <PageHeader
        title="Command Center"
        subtitle="Your BlackVault overview for inventory, ammo, training, and maintenance."
      />
      <DashboardClient data={data} />
    </div>
  );
}
