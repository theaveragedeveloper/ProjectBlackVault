import { prisma } from "@/lib/prisma";

export interface DashboardStatsResponse {
  totals: {
    firearms: number;
    accessories: number;
    ammoRounds: number;
    ammoStocks: number;
  };
  investment: {
    totalCost: number;
    totalCurrentValue: number;
    unrealizedGainLoss: number;
    firearmCost: number;
    firearmCurrentValue: number;
    accessoryCost: number;
  };
  ammo: {
    stocks: Array<{
      id: string;
      caliber: string;
      brand: string;
      quantity: number;
      purchasePrice: number | null;
      lowStockAlert: number | null;
      grainWeight: number | null;
      bulletType: string | null;
    }>;
    byCaliber: Array<{
      caliber: string;
      totalRounds: number;
      stockCount: number;
      lowStock: boolean;
    }>;
    lowStockCount: number;
    lowStockItems: Array<{
      id: string;
      caliber: string;
      brand: string;
      quantity: number;
      lowStockAlert: number | null;
    }>;
  };
  recent: {
    firearms: Array<{
      id: string;
      name: string;
      manufacturer: string;
      model: string;
      type: string;
      caliber: string;
      imageUrl: string | null;
      acquisitionDate: Date | null;
      createdAt: Date;
    }>;
    accessories: Array<{
      id: string;
      name: string;
      manufacturer: string;
      type: string;
      imageUrl: string | null;
      createdAt: Date;
    }>;
    ammo: Array<{
      id: string;
      caliber: string;
      brand: string;
      quantity: number;
      updatedAt: Date;
    }>;
  };
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
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
      select: {
        id: true,
        purchasePrice: true,
        currentValue: true,
      },
    }),
    prisma.accessory.findMany({
      select: {
        id: true,
        purchasePrice: true,
      },
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

    if (
      stock.lowStockAlert !== null &&
      stock.lowStockAlert !== undefined &&
      stock.quantity <= stock.lowStockAlert
    ) {
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
    (s) =>
      s.lowStockAlert !== null &&
      s.lowStockAlert !== undefined &&
      s.quantity <= s.lowStockAlert
  );

  return {
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
      stocks: ammoStocks.map((s) => ({
        id: s.id,
        caliber: s.caliber,
        brand: s.brand,
        quantity: s.quantity,
        purchasePrice: s.purchasePrice,
        lowStockAlert: s.lowStockAlert,
        grainWeight: s.grainWeight,
        bulletType: s.bulletType,
      })),
      byCaliber: Object.values(ammoByCaliber).sort((a, b) => a.caliber.localeCompare(b.caliber)),
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
  };
}
