import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { detectFileSignature } from "@/lib/server/file-signatures";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "png", "webp"]);

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

// POST /api/documents/upload
// Accepts multipart form data: file, name, type, firearmId?, accessoryId?, notes?
// Saves to /storage/uploads/documents/{uuid}.{ext}
// Creates a Document record and returns it.
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `upload:documents:${ip}`, windowMs: 60_000, maxAttempts: 20 });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many upload attempts. Please wait a minute." },
        { status: 429 }
      );
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

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 20MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const detected = detectFileSignature(buffer);

    if (!detected || !ALLOWED_EXTENSIONS.has(detected.extension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}` },
        { status: 400 }
      );
    }

    // Generate a unique ID for the file
    const fileId = crypto.randomUUID().replace(/-/g, "");

    const fileName = `${fileId}.${detected.extension}`;
    const relativeUrl = `/api/files/documents/${fileName}`;

    const projectRoot = process.cwd();
    const uploadDir = path.join(projectRoot, "storage", "uploads", "documents");
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });

    await fs.writeFile(filePath, buffer);

    const doc = await prisma.document.create({
      data: {
        name,
        type,
        fileUrl: relativeUrl,
        fileSize: file.size,
        mimeType: detected.mimeType,
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
