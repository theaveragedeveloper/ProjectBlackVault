import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/accessories/[id]/battery - Log a battery change
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let changedAt = new Date();
  try {
    const body = await req.json();
    if (body?.changedAt) {
      const parsed = new Date(body.changedAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid changedAt date" }, { status: 400 });
      }
      changedAt = parsed;
    }
  } catch {
    // Empty body is valid and defaults to now.
  }

  const accessory = await prisma.accessory.findUnique({ where: { id } });
  if (!accessory) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!accessory.hasBattery) return NextResponse.json({ error: "Battery tracking not enabled for this accessory" }, { status: 400 });

  const updated = await prisma.accessory.update({
    where: { id },
    data: { batteryChangedAt: changedAt },
  });

  return NextResponse.json(updated);
}
