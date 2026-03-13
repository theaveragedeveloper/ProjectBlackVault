import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.maintenanceNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const isNotFound = typeof error === "object" && error !== null && (error as { code?: string }).code === "P2025";
    if (isNotFound) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    console.error("DELETE /api/maintenance-notes/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
