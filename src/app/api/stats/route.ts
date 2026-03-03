import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stats - Dashboard stats
// Returns: total firearms, total accessories, total ammo by caliber,
//          total investment value, recent items
export async function GET() {
  try {
    const [
      firearmCount,
      accessoryCount,
      ammoStocks,
      firearms,
      accessories,
      recentFirearms,
      recentAccessories,
      recentAmmo,
    ] = await Promise.all([
      // Total firearms
      prisma.firearm.count(),

      // Total accessories
      prisma.accessory.count(),

      // All ammo stocks (to compute totals by caliber and investment)
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

      // All firearms for investment calculations
      prisma.firearm.findMany({
        select: {
          id: true,
          purchasePrice: true,
          currentValue: true,
        },
      }),

      // All accessories for investment calculations
      prisma.accessory.findMany({
        select: {
          id: true,
          purchasePrice: true,
        },
      }),

      // Recently added firearms
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
          createdAt: true,
        },
      }),

      // Recently added accessories
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

      // Recently updated ammo stocks
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
    ]);

    // Aggregate ammo by caliber
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

      // Flag as low stock if quantity falls at or below the alert threshold
      if (
        stock.lowStockAlert !== null &&
        stock.lowStockAlert !== undefined &&
        stock.quantity <= stock.lowStockAlert
      ) {
        ammoByCaliber[stock.caliber].lowStock = true;
      }
    }

    // Investment calculations
    const totalFirearmInvestment = firearms.reduce(
      (sum, f) => sum + (f.purchasePrice ?? 0),
      0
    );
    const totalFirearmCurrentValue = firearms.reduce(
      (sum, f) => sum + (f.currentValue ?? f.purchasePrice ?? 0),
      0
    );
    const totalAccessoryInvestment = accessories.reduce(
      (sum, a) => sum + (a.purchasePrice ?? 0),
      0
    );
    const totalInvestment =
      totalFirearmInvestment + totalAccessoryInvestment;
    const totalCurrentValue =
      totalFirearmCurrentValue + totalAccessoryInvestment;
    const unrealizedGainLoss = totalCurrentValue - totalInvestment;

    // Low stock alerts
    const lowStockItems = ammoStocks.filter(
      (s) =>
        s.lowStockAlert !== null &&
        s.lowStockAlert !== undefined &&
        s.quantity <= s.lowStockAlert
    );

    return NextResponse.json({
      totals: {
        firearms: firearmCount,
        accessories: accessoryCount,
        ammoRounds: totalAmmoRounds,
        ammoStocks: ammoStocks.length,
      },
      investment: {
        totalCost: totalInvestment,
        totalCurrentValue,
        unrealizedGainLoss,
        firearmCost: totalFirearmInvestment,
        firearmCurrentValue: totalFirearmCurrentValue,
        accessoryCost: totalAccessoryInvestment,
      },
      ammo: {
        byCaliber: Object.values(ammoByCaliber).sort((a, b) =>
          a.caliber.localeCompare(b.caliber)
        ),
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((s) => ({
          id: s.id,
          caliber: s.caliber,
          brand: s.brand,
          quantity: s.quantity,
          lowStockAlert: s.lowStockAlert,
        })),
      },
      recent: {
        firearms: recentFirearms,
        accessories: recentAccessories,
        ammo: recentAmmo,
      },
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
