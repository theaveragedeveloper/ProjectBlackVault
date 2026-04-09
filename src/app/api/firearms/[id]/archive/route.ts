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

    const firearm = await prisma.firearm.findUnique({ where: { id }, select: { id: true } });
    if (!firearm) {
      return NextResponse.json({ error: "Firearm not found" }, { status: 404 });
    }

    await prisma.firearm.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/firearms/[id]/archive error:", error);
    return NextResponse.json({ error: "Failed to update firearm" }, { status: 500 });
  }
}
