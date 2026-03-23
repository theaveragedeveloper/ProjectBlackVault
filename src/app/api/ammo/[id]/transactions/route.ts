import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardData } from "@/lib/dashboard/revalidate-dashboard";

// Types that subtract from quantity
const SUBTRACT_TYPES = new Set(["RANGE_USE", "TRANSFER_OUT", "EXPENDED"]);
// Types that add to quantity
const ADD_TYPES = new Set(["PURCHASE"]);
// Types that set the quantity directly (correction)
const CORRECTION_TYPES = new Set(["INVENTORY_CORRECTION"]);

// POST /api/ammo/[id]/transactions - Post an ammo transaction
// Body: { type: string, quantity: number, note?: string }
// Handles PURCHASE (add) vs RANGE_USE/TRANSFER_OUT/EXPENDED (subtract).
// INVENTORY_CORRECTION sets the quantity directly.
// Updates stock.quantity.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, quantity, note } = body;

    if (!type || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: "Missing required fields: type, quantity" },
        { status: 400 }
      );
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: "quantity must be a non-negative integer" },
        { status: 400 }
      );
    }

    const validTypes = [
      "PURCHASE",
      "RANGE_USE",
      "TRANSFER_OUT",
      "INVENTORY_CORRECTION",
      "EXPENDED",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid transaction type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const stock = await prisma.ammoStock.findUnique({ where: { id } });
    if (!stock) {
      return NextResponse.json(
        { error: "Ammo stock not found" },
        { status: 404 }
      );
    }

    const previousQty = stock.quantity;
    let newQty: number;

    if (ADD_TYPES.has(type)) {
      newQty = previousQty + quantity;
    } else if (SUBTRACT_TYPES.has(type)) {
      newQty = previousQty - quantity;
      if (newQty < 0) {
        return NextResponse.json(
          {
            error: `Insufficient quantity. Current stock: ${previousQty}, requested: ${quantity}`,
          },
          { status: 400 }
        );
      }
    } else if (CORRECTION_TYPES.has(type)) {
      // INVENTORY_CORRECTION sets stock to the provided quantity directly
      newQty = quantity;
    } else {
      newQty = previousQty;
    }

    // Use a transaction to atomically update stock quantity and create the transaction record
    const [updatedStock, transaction] = await prisma.$transaction([
      prisma.ammoStock.update({
        where: { id },
        data: { quantity: newQty },
      }),
      prisma.ammoTransaction.create({
        data: {
          stockId: id,
          type,
          quantity,
          previousQty,
          newQty,
          note: note ?? null,
        },
      }),
    ]);

    revalidateDashboardData();

    return NextResponse.json(
      {
        stock: updatedStock,
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/ammo/[id]/transactions error:", error);
    return NextResponse.json(
      { error: "Failed to create ammo transaction" },
      { status: 500 }
    );
  }
}
