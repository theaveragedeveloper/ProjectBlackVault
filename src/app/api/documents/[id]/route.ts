import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { isSafeDocumentUrl } from "@/lib/upload-security";

const DOC_TYPES = new Set(["RECIPE", "TAX_STAMP", "RECEIPT", "OTHER"]);
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

function resolveUploadRoot(): string {
  return process.env.IMAGE_UPLOAD_DIR
    ? path.resolve(process.env.IMAGE_UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

function resolveDocumentPath(fileUrl: string): string | null {
  if (!isSafeDocumentUrl(fileUrl)) return null;
  const fileName = fileUrl.slice("/uploads/documents/".length);
  return path.join(resolveUploadRoot(), "documents", fileName);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!SAFE_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

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
  } catch {
    console.error("GET /api/documents/[id] failed");
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!SAFE_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const parsedBody = typeof body === "object" && body !== null
      ? body as Record<string, unknown>
      : {};
    const { name, type, notes, firearmId, accessoryId } = parsedBody;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      const normalizedName = String(name).trim();
      if (!normalizedName || normalizedName.length > 200) {
        return NextResponse.json({ error: "name must be 1-200 characters" }, { status: 400 });
      }
      updateData.name = normalizedName;
    }
    if (type !== undefined) updateData.type = typeof type === "string" && DOC_TYPES.has(type) ? type : "OTHER";
    if (notes !== undefined) updateData.notes = typeof notes === "string" && notes.trim() ? notes.trim().slice(0, 2000) : null;
    if (firearmId !== undefined) {
      if (typeof firearmId === "string" && firearmId.trim()) {
        if (!SAFE_ID_RE.test(firearmId.trim())) {
          return NextResponse.json({ error: "Invalid firearmId format" }, { status: 400 });
        }
        updateData.firearmId = firearmId.trim();
      } else {
        updateData.firearmId = null;
      }
    }
    if (accessoryId !== undefined) {
      if (typeof accessoryId === "string" && accessoryId.trim()) {
        if (!SAFE_ID_RE.test(accessoryId.trim())) {
          return NextResponse.json({ error: "Invalid accessoryId format" }, { status: 400 });
        }
        updateData.accessoryId = accessoryId.trim();
      } else {
        updateData.accessoryId = null;
      }
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(document);
  } catch {
    console.error("PUT /api/documents/[id] failed");
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!SAFE_ID_RE.test(id)) {
      return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

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
  } catch {
    console.error("DELETE /api/documents/[id] failed");
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
