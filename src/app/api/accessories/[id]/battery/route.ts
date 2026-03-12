import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidateDashboardCaches } from "@/lib/server/dashboard";

// POST /api/accessories/[id]/battery - Log a battery change
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const accessory = await prisma.accessory.findUnique({ where: { id } });
  if (!accessory) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!accessory.hasBattery) return NextResponse.json({ error: "Battery tracking not enabled for this accessory" }, { status: 400 });

  const updated = await prisma.accessory.update({
    where: { id },
    data: { batteryChangedAt: new Date() },
  });

  revalidateDashboardCaches(["accessories"]);

  return NextResponse.json(updated);
}
