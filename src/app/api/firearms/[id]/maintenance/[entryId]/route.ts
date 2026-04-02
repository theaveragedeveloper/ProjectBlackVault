import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await params;

  const log = await prisma.maintenanceLog.findUnique({
    where: { id: entryId },
  });

  if (!log || log.firearmId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.maintenanceLog.delete({ where: { id: entryId } });

  return NextResponse.json({ success: true });
}
