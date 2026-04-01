import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardData } from "@/lib/dashboard/revalidate-dashboard";

// GET /api/ammo/[id] - Get a single AmmoStock entry
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stock = await prisma.ammoStock.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { transactedAt: "desc" },
        },
      },
    });

    if (!stock) {
      return NextResponse.json(
        { error: "Ammo stock not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error("GET /api/ammo/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ammo stock" },
      { status: 500 }
    );
  }
}

// PUT /api/ammo/[id] - Update an AmmoStock entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      caliber,
      brand,
      grainWeight,
      bulletType,
      quantity,
      purchasePrice,
      pricePerRound,
      purchaseDate,
      storageLocation,
      lowStockAlert,
      notes,
    } = body;

    const existing = await prisma.ammoStock.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Ammo stock not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.ammoStock.update({
      where: { id },
      data: {
        ...(caliber !== undefined && { caliber }),
        ...(brand !== undefined && { brand }),
        ...(grainWeight !== undefined && { grainWeight }),
        ...(bulletType !== undefined && { bulletType }),
        ...(quantity !== undefined && { quantity }),
        ...(purchasePrice !== undefined && { purchasePrice }),
        ...(pricePerRound !== undefined && { pricePerRound: pricePerRound ?? null }),
        ...(purchaseDate !== undefined && {
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        }),
        ...(storageLocation !== undefined && { storageLocation }),
        ...(lowStockAlert !== undefined && { lowStockAlert }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        transactions: {
          orderBy: { transactedAt: "desc" },
          take: 10,
        },
      },
    });

    revalidateDashboardData();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/ammo/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update ammo stock" },
      { status: 500 }
    );
  }
}

// DELETE /api/ammo/[id] - Delete an AmmoStock entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.ammoStock.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Ammo stock not found" },
        { status: 404 }
      );
    }

    // Count session links — returned to client for confirmation UI
    const sessionLinkCount = await prisma.rangeSessionAmmoLink.count({
      where: { ammoStockId: id },
    });

    await prisma.ammoStock.delete({ where: { id } });
    revalidateDashboardData();

    return NextResponse.json({ success: true, id, sessionLinkCount });
  } catch (error) {
    console.error("DELETE /api/ammo/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete ammo stock" },
      { status: 500 }
    );
  }
}
