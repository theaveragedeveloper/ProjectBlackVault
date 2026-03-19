import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const DOC_TYPES = new Set(["RECIPE", "TAX_STAMP", "RECEIPT", "OTHER"]);
const MAX_SIZE = 20 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function resolveUploadRoot(): string {
  return process.env.IMAGE_UPLOAD_DIR
    ? path.resolve(process.env.IMAGE_UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string | null)?.trim();
    const type = (formData.get("type") as string | null) ?? "OTHER";
    const notes = (formData.get("notes") as string | null)?.trim();
    const firearmId = (formData.get("firearmId") as string | null)?.trim();
    const accessoryId = (formData.get("accessoryId") as string | null)?.trim();

    if (!file || !name) {
      return NextResponse.json({ error: "file and name are required" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 20MB." }, { status: 400 });
    }

    const originalName = file.name ?? "";
    const dotIndex = originalName.lastIndexOf(".");
    let ext = dotIndex !== -1 ? originalName.slice(dotIndex + 1).toLowerCase() : "";
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      ext = MIME_TO_EXT[file.type] ?? "";
    }
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}` },
        { status: 400 }
      );
    }

    const safeType = DOC_TYPES.has(type) ? type : "OTHER";
    const fileName = `${crypto.randomUUID().replace(/-/g, "")}.${ext}`;
    const relativeUrl = `/uploads/documents/${fileName}`;
    const uploadDir = path.join(resolveUploadRoot(), "documents");
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    const document = await prisma.document.create({
      data: {
        name: name.slice(0, 200),
        type: safeType,
        fileUrl: relativeUrl,
        fileSize: file.size,
        mimeType: file.type || null,
        notes: notes ? notes.slice(0, 2000) : null,
        firearmId: firearmId || null,
        accessoryId: accessoryId || null,
      },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
