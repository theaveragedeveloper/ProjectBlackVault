import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

// GET /api/analytics/ammo-cost
export async function GET() {
  try {
    const [purchaseTransactions, allStocks] = await Promise.all([
      prisma.ammoTransaction.findMany({
        where: { type: "PURCHASE" },
        include: { stock: { select: { caliber: true, purchasePrice: true } } },
        orderBy: { transactedAt: "asc" },
      }),
      prisma.ammoStock.findMany({
        select: { caliber: true, quantity: true, purchasePrice: true },
      }),
    ]);

    // Monthly purchases (last 12 months)
    const monthlyMap = new Map<string, { amount: number; rounds: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      monthlyMap.set(getMonthKey(d), { amount: 0, rounds: 0 });
    }

    let allTimeSpend = 0;
    for (const t of purchaseTransactions) {
      const costPerRound = t.stock.purchasePrice ?? 0;
      const cost = t.quantity * costPerRound;
      allTimeSpend += cost;
      const key = getMonthKey(new Date(t.transactedAt));
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key)!;
        entry.amount += cost;
        entry.rounds += t.quantity;
      }
    }

    const monthlyPurchases = Array.from(monthlyMap.entries()).map(([key, val]) => ({
      month: getMonthLabel(key),
      amount: Math.round(val.amount * 100) / 100,
      rounds: val.rounds,
    }));

    // Inventory value
    const inventoryValue = allStocks.reduce(
      (sum, s) => sum + s.quantity * (s.purchasePrice ?? 0),
      0
    );

    // Cost per round by caliber (weighted avg across all stocks for that caliber)
    const caliberMap = new Map<string, { totalCost: number; totalRounds: number }>();
    for (const s of allStocks) {
      if (s.purchasePrice == null) continue;
      const entry = caliberMap.get(s.caliber) ?? { totalCost: 0, totalRounds: 0 };
      // Weight by quantity (proxy for how much was purchased at this price)
      entry.totalCost += s.purchasePrice * s.quantity;
      entry.totalRounds += s.quantity;
      caliberMap.set(s.caliber, entry);
    }

    const costPerRound = Array.from(caliberMap.entries())
      .filter(([, v]) => v.totalRounds > 0)
      .map(([caliber, v]) => ({
        caliber,
        avgCostPerRound: Math.round((v.totalCost / v.totalRounds) * 1000) / 1000,
      }))
      .sort((a, b) => a.caliber.localeCompare(b.caliber));

    return NextResponse.json({
      monthlyPurchases,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      costPerRound,
      allTimeSpend: Math.round(allTimeSpend * 100) / 100,
    });
  } catch (error) {
    console.error("GET /api/analytics/ammo-cost error:", error);
    return NextResponse.json({ error: "Failed to fetch cost analytics" }, { status: 500 });
  }
}
