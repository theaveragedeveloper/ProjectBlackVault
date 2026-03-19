import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  extensionFromFilename,
  extensionFromMime,
  validateUploadBuffer,
} from "@/lib/upload-security";

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "png",
  "gif",
  "webp",
  "avif",
]);

const ALLOWED_ENTITY_TYPES = new Set([
  "firearm",
  "accessory",
  "ammo",
]);
const MAX_SIZE = 10 * 1024 * 1024;
const SAFE_ENTITY_ID = /^[a-zA-Z0-9_-]{1,64}$/;

// POST /api/images/upload - Upload an image for an entity
// Accepts multipart form data: file, entityType, entityId
// Saves to /public/uploads/{entityType}s/{entityId}.{ext}
// Returns the URL path.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string | null;
    const entityId = formData.get("entityId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Missing required field: file" },
        { status: 400 }
      );
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId" },
        { status: 400 }
      );
    }

    if (!ALLOWED_ENTITY_TYPES.has(entityType)) {
      return NextResponse.json(
        {
          error: `Invalid entityType. Must be one of: ${Array.from(ALLOWED_ENTITY_TYPES).join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!SAFE_ENTITY_ID.test(entityId)) {
      return NextResponse.json(
        { error: "Invalid entityId" },
        { status: 400 }
      );
    }
    const sanitizedEntityId = entityId;

    // Determine the file extension
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/avif": "avif",
    };
    const extFromName = extensionFromFilename(file.name ?? "");
    const extFromContentType = extensionFromMime(file.type ?? "", mimeToExt);
    const ext = extFromName ?? extFromContentType;

    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const detectedExt = validateUploadBuffer(buffer, ALLOWED_EXTENSIONS);
    if (!detectedExt) {
      return NextResponse.json(
        { error: "The uploaded content is not a supported image format." },
        { status: 400 }
      );
    }
    if (detectedExt !== ext) {
      return NextResponse.json(
        { error: "File extension or MIME type does not match image content." },
        { status: 400 }
      );
    }

    // Build paths
    // entityType = "firearm" -> directory = "firearms"
    const entityTypeDir = `${entityType}s`;
    const fileName = `${sanitizedEntityId}.${detectedExt}`;
    const relativeUrl = `/uploads/${entityTypeDir}/${fileName}`;

    // Resolve the absolute path within the upload storage directory.
    // Docker uses /app/uploads (mounted volume). Local dev defaults to <project>/uploads.
    const uploadRoot = process.env.IMAGE_UPLOAD_DIR
      ? path.resolve(process.env.IMAGE_UPLOAD_DIR)
      : path.join(process.cwd(), "uploads");
    const uploadDir = path.join(uploadRoot, entityTypeDir);
    const filePath = path.join(uploadDir, fileName);

    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Write to disk with owner-only permissions
    await fs.writeFile(filePath, buffer, { mode: 0o600 });

    return NextResponse.json(
      {
        url: relativeUrl,
        entityType,
        entityId: sanitizedEntityId,
        fileName,
        size: file.size,
        mimeType: file.type,
      },
      { status: 201 }
    );
  } catch {
    console.error("POST /api/images/upload failed");
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
