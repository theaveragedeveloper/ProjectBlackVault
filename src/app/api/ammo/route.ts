import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/ammo - List all AmmoStock grouped by caliber
export async function GET() {
  try {
    const stocks = await prisma.ammoStock.findMany({
      include: {
        _count: {
          select: { transactions: true },
        },
        transactions: {
          orderBy: { transactedAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ caliber: "asc" }, { brand: "asc" }],
    });

    // Group by caliber
    const grouped: Record<
      string,
      {
        caliber: string;
        totalQuantity: number;
        avgPricePerRound: number | null;
        pricedRounds: number;
        pricedValue: number;
        stocks: typeof stocks;
      }
    > = {};

    for (const stock of stocks) {
      if (!grouped[stock.caliber]) {
        grouped[stock.caliber] = {
          caliber: stock.caliber,
          totalQuantity: 0,
          avgPricePerRound: null,
          pricedRounds: 0,
          pricedValue: 0,
          stocks: [],
        };
      }
      grouped[stock.caliber].totalQuantity += stock.quantity;
      if (typeof stock.purchasePrice === "number" && stock.purchasePrice > 0) {
        grouped[stock.caliber].pricedRounds += stock.quantity;
        grouped[stock.caliber].pricedValue += stock.quantity * stock.purchasePrice;
      }
      grouped[stock.caliber].stocks.push(stock);
    }

    for (const group of Object.values(grouped)) {
      group.avgPricePerRound =
        group.pricedRounds > 0 ? group.pricedValue / group.pricedRounds : null;
    }

    const result = {
      grouped: Object.values(grouped).sort((a, b) =>
        a.caliber.localeCompare(b.caliber)
      ),
      all: stocks,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/ammo error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ammo stock" },
      { status: 500 }
    );
  }
}

// POST /api/ammo - Create a new AmmoStock entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      caliber,
      brand,
      grainWeight,
      bulletType,
      quantity,
      purchasePrice,
      purchasePriceTotal,
      purchaseDate,
      storageLocation,
      lowStockAlert,
      notes,
    } = body;

    if (!caliber || !brand) {
      return NextResponse.json(
        { error: "Missing required fields: caliber, brand" },
        { status: 400 }
      );
    }

    if (purchasePrice !== undefined && purchasePrice !== null && Number(purchasePrice) < 0) {
      return NextResponse.json({ error: "purchasePrice cannot be negative" }, { status: 400 });
    }
    if (
      purchasePriceTotal !== undefined &&
      purchasePriceTotal !== null &&
      Number(purchasePriceTotal) < 0
    ) {
      return NextResponse.json({ error: "purchasePriceTotal cannot be negative" }, { status: 400 });
    }

    const quantityValue = Number(quantity ?? 0);
    const normalizedPerRoundPrice =
      purchasePrice !== undefined && purchasePrice !== null
        ? Number(purchasePrice)
        : purchasePriceTotal !== undefined &&
            purchasePriceTotal !== null &&
            quantityValue > 0
          ? Number(purchasePriceTotal) / quantityValue
          : null;

    const stock = await prisma.ammoStock.create({
      data: {
        caliber,
        brand,
        grainWeight: grainWeight ?? null,
        bulletType: bulletType ?? null,
        quantity: quantityValue,
        purchasePrice:
          normalizedPerRoundPrice !== null && Number.isFinite(normalizedPerRoundPrice)
            ? normalizedPerRoundPrice
            : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        storageLocation: storageLocation ?? null,
        lowStockAlert: lowStockAlert ?? null,
        notes: notes ?? null,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json(stock, { status: 201 });
  } catch (error) {
    console.error("POST /api/ammo error:", error);
    return NextResponse.json(
      { error: "Failed to create ammo stock" },
      { status: 500 }
    );
  }
}
