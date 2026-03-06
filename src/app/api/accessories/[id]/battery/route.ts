import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/accessories/[id]/battery - Log a battery change
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const accessory = await prisma.accessory.findUnique({ where: { id } });
  if (!accessory) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.accessory.update({
    where: { id },
    data: { batteryChangedAt: new Date() },
  });

  return NextResponse.json(updated);
}
