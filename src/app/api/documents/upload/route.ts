import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  extensionFromFilename,
  extensionFromMime,
  validateUploadBuffer,
} from "@/lib/upload-security";

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "png", "webp"]);
const DOC_TYPES = new Set(["RECIPE", "TAX_STAMP", "RECEIPT", "OTHER"]);
const MAX_SIZE = 20 * 1024 * 1024;
const SAFE_REF_RE = /^[a-zA-Z0-9_-]{1,64}$/;

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
    const name = (formData.get("name") as string | null)?.trim() ?? "";
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

    if (name.length > 200) {
      return NextResponse.json({ error: "Document name is too long (max 200 characters)." }, { status: 400 });
    }

    if (notes && notes.length > 2000) {
      return NextResponse.json({ error: "Notes are too long (max 2000 characters)." }, { status: 400 });
    }

    if (firearmId && !SAFE_REF_RE.test(firearmId)) {
      return NextResponse.json({ error: "Invalid firearmId format." }, { status: 400 });
    }
    if (accessoryId && !SAFE_REF_RE.test(accessoryId)) {
      return NextResponse.json({ error: "Invalid accessoryId format." }, { status: 400 });
    }

    const extFromName = extensionFromFilename(file.name ?? "");
    const extFromContentType = extensionFromMime(file.type ?? "", MIME_TO_EXT);
    const declaredExt = extFromName ?? extFromContentType;
    if (!declaredExt || !ALLOWED_EXTENSIONS.has(declaredExt)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const detectedExt = validateUploadBuffer(buffer, ALLOWED_EXTENSIONS);
    if (!detectedExt) {
      return NextResponse.json(
        { error: "The uploaded file content does not match an allowed document type." },
        { status: 400 }
      );
    }
    if (declaredExt !== detectedExt) {
      return NextResponse.json(
        { error: "File extension or MIME type does not match the uploaded content." },
        { status: 400 }
      );
    }

    const safeType = DOC_TYPES.has(type) ? type : "OTHER";
    const fileName = `${crypto.randomUUID().replace(/-/g, "")}.${detectedExt}`;
    const relativeUrl = `/uploads/documents/${fileName}`;
    const uploadDir = path.join(resolveUploadRoot(), "documents");
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer, { mode: 0o600 });

    const document = await prisma.document.create({
      data: {
        name,
        type: safeType,
        fileUrl: relativeUrl,
        fileSize: file.size,
        mimeType: file.type ? file.type.toLowerCase() : null,
        notes: notes ?? null,
        firearmId: firearmId || null,
        accessoryId: accessoryId || null,
      },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch {
    console.error("POST /api/documents/upload failed");
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
