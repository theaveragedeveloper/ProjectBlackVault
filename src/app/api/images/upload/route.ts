import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { detectFileSignature } from "@/lib/server/file-signatures";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { ALLOWED_IMAGE_EXTENSIONS, SUPPORTED_IMAGE_FORMATS_LABEL } from "@/lib/image-formats";

const ALLOWED_EXTENSIONS = new Set<string>(ALLOWED_IMAGE_EXTENSIONS);

const ALLOWED_ENTITY_TYPES = new Set([
  "firearm",
  "accessory",
  "ammo",
  "build",
]);

// POST /api/images/upload - Upload an image for an entity
// Accepts multipart form data: file, entityType, entityId
// Saves to /storage/uploads/images/{entityType}s/{entityId}.{ext}
// Returns the URL path.
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `upload:images:${ip}`, windowMs: 60_000, maxAttempts: 20 });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many upload attempts. Please wait a minute." },
        { status: 429 }
      );
    }

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

    // Check file size (limit to 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const detected = detectFileSignature(buffer);

    if (!detected || !ALLOWED_EXTENSIONS.has(detected.extension)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Supported formats: ${SUPPORTED_IMAGE_FORMATS_LABEL}.`,
        },
        { status: 400 }
      );
    }

    // Build paths
    // entityType = "firearm" -> directory = "firearms"
    const entityTypeDir = `${entityType}s`;
    const fileName = `${sanitizedEntityId}_${Date.now()}.${detected.extension}`;
    const relativeUrl = `/api/files/images/${entityTypeDir}/${fileName}`;

    // Resolve the absolute path outside the web root
    const projectRoot = process.cwd();
    const uploadDir = path.join(projectRoot, "storage", "uploads", "images", entityTypeDir);
    const filePath = path.join(uploadDir, fileName);

    // Ensure the directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    await fs.writeFile(filePath, buffer);

    return NextResponse.json(
      {
        url: relativeUrl,
        entityType,
        entityId: sanitizedEntityId,
        fileName,
        size: file.size,
        mimeType: detected.mimeType,
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
