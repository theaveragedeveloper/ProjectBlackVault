import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const DOC_TYPES = new Set(["RECIPE", "TAX_STAMP", "RECEIPT", "OTHER"]);

function resolveUploadRoot(): string {
  return process.env.IMAGE_UPLOAD_DIR
    ? path.resolve(process.env.IMAGE_UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

function resolveDocumentPath(fileUrl: string): string | null {
  if (!fileUrl.startsWith("/uploads/documents/")) return null;
  const fileName = fileUrl.slice("/uploads/documents/".length);
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) return null;
  return path.join(resolveUploadRoot(), "documents", fileName);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("GET /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, notes, firearmId, accessoryId } = body ?? {};

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).slice(0, 200);
    if (type !== undefined) updateData.type = typeof type === "string" && DOC_TYPES.has(type) ? type : "OTHER";
    if (notes !== undefined) updateData.notes = typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 2000) : null;
    if (firearmId !== undefined) updateData.firearmId = typeof firearmId === "string" && firearmId.trim() ? firearmId : null;
    if (accessoryId !== undefined) updateData.accessoryId = typeof accessoryId === "string" && accessoryId.trim() ? accessoryId : null;

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("PUT /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id } });

    const filePath = resolveDocumentPath(existing.fileUrl);
    if (filePath) {
      await fs.unlink(filePath).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
