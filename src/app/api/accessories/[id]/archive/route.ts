import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const archived = Boolean(body?.archived);

    const accessory = await prisma.accessory.findUnique({ where: { id }, select: { id: true } });
    if (!accessory) {
      return NextResponse.json({ error: "Accessory not found" }, { status: 404 });
    }

    await prisma.accessory.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/accessories/[id]/archive error:", error);
    return NextResponse.json({ error: "Failed to update accessory" }, { status: 500 });
  }
}
