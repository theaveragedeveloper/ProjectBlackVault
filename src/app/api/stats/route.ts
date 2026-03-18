import { NextResponse } from "next/server";
import { getDashboardAggregates } from "@/lib/server/dashboard";
import { requireAuth } from "@/lib/server/auth";

// GET /api/stats - Dashboard stats
// Returns: total firearms, total accessories, total ammo by caliber,
//          total investment value, recent items
export async function GET() {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const data = await getDashboardAggregates();

    return NextResponse.json({
      totals: {
        firearms: data.firearmCount,
        accessories: data.accessoryCount,
        ammoRounds: data.totalAmmoRounds,
        ammoStocks: data.ammoStocks.length,
      },
      investment: {
        totalCost: data.totalInvestment,
        totalCurrentValue: data.totalCurrentValue,
        unrealizedGainLoss: data.unrealizedGainLoss,
        firearmCost: data.totalFirearmInvestment,
        firearmCurrentValue: data.totalFirearmCurrentValue,
        accessoryCost: data.totalAccessoryInvestment,
      },
      ammo: {
        byCaliber: data.ammoByCaliber,
        lowStockCount: data.lowStockItems.length,
        lowStockItems: data.lowStockItems.map((s) => ({
          id: s.id,
          caliber: s.caliber,
          brand: s.brand,
          quantity: s.quantity,
          lowStockAlert: s.lowStockAlert,
        })),
      },
      recent: {
        firearms: data.recentFirearms,
        accessories: data.recentAccessories,
        ammo: data.recentAmmo,
      },
      rangeSessions: data.rangeStats,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
