import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";
import { resolveDocumentStoragePath } from "@/lib/upload-security";

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2025";
}

async function deleteFileIfSafe(fileUrl: string | null | undefined) {
  if (!fileUrl) return;

  const filePath = resolveDocumentStoragePath(fileUrl);
  if (!filePath) {
    console.warn("Skipping unsafe document file deletion:", fileUrl);
    return;
  }

  try {
    const stat = await fs.lstat(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      return;
    }
    await fs.unlink(filePath);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const doc = await (prisma as any).document.findUnique({
      where: { id },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    console.error("GET /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, notes, firearmId, accessoryId } = body;

    const doc = await (prisma as any).document.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(firearmId !== undefined && { firearmId: firearmId || null }),
        ...(accessoryId !== undefined && { accessoryId: accessoryId || null }),
      },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(doc);
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("PUT /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const doc = await (prisma as any).document.findUnique({
      where: { id },
      select: { id: true, fileUrl: true },
    });

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await deleteFileIfSafe(doc.fileUrl);
    await (prisma as any).document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isNotFoundError(error)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
