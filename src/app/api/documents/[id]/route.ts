import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const safeId = id.replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = path.join(process.cwd(), "public", "uploads", "documents", safeId);
    await fs.unlink(filePath);
    return NextResponse.json({ success: true, id: safeId });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
