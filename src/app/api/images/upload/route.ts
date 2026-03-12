import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "svg",
]);

const ALLOWED_ENTITY_TYPES = new Set([
  "firearm",
  "accessory",
  "ammo",
]);

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

    // Sanitize entityId to prevent path traversal
    const sanitizedEntityId = entityId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedEntityId) {
      return NextResponse.json(
        { error: "Invalid entityId" },
        { status: 400 }
      );
    }

    // Determine the file extension
    const originalName = file.name ?? "";
    const dotIndex = originalName.lastIndexOf(".");
    let ext = dotIndex !== -1 ? originalName.slice(dotIndex + 1).toLowerCase() : "";

    // Also check MIME type as fallback
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/avif": "avif",
        "image/svg+xml": "svg",
      };
      ext = mimeToExt[file.type] ?? "";
    }

    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Build paths
    // entityType = "firearm" -> directory = "firearms"
    const entityTypeDir = `${entityType}s`;
    const fileName = `${sanitizedEntityId}_${Date.now()}.${ext}`;
    const relativeUrl = `/uploads/${entityTypeDir}/${fileName}`;

    // Resolve the absolute path within the project's public directory
    const projectRoot = process.cwd();
    const uploadDir = path.join(projectRoot, "public", "uploads", entityTypeDir);
    const filePath = path.join(uploadDir, fileName);

    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Read the file contents and write to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

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
  } catch (error) {
    console.error("POST /api/images/upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
