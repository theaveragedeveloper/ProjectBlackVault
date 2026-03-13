import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

// POST /api/documents/upload
// Accepts multipart form data: file, name, type, firearmId?, accessoryId?, notes?
// Saves to /public/uploads/documents/{cuid}.{ext}
// Creates a Document record and returns it.
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rate = await enforceRateLimit({ key: `documents:upload:${ip}`, windowMs: 60_000, maxAttempts: 10 });
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 23068672) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const type = (formData.get("type") as string | null) || "RECEIPT";
    const firearmId = formData.get("firearmId") as string | null;
    const accessoryId = formData.get("accessoryId") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Missing required field: file" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
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

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 20MB." }, { status: 400 });
    }

    // Generate a unique ID for the file
    const fileId = crypto.randomUUID().replace(/-/g, "");

    const fileName = `${fileId}.${ext}`;
    const relativeUrl = `/uploads/documents/${fileName}`;

    const projectRoot = process.cwd();
    const uploadDir = path.join(projectRoot, "public", "uploads", "documents");
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const doc = await prisma.document.create({
      data: {
        name,
        type,
        fileUrl: relativeUrl,
        fileSize: file.size,
        mimeType: file.type || null,
        notes: notes || null,
        firearmId: firearmId || null,
        accessoryId: accessoryId || null,
      },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
