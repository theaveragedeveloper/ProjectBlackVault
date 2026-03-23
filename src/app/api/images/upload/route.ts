import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { detectFileSignature, isHeicFamilySignature } from "@/lib/server/file-signatures";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { requireAuth } from "@/lib/server/auth";
import { ALLOWED_IMAGE_EXTENSIONS, SUPPORTED_IMAGE_FORMATS_LABEL } from "@/lib/image-formats";
import { requireEntityWriteAccess, type WritableEntityType } from "@/lib/server/entity-write-access";

const ALLOWED_EXTENSIONS = new Set<string>(ALLOWED_IMAGE_EXTENSIONS);

const ALLOWED_ENTITY_TYPES = new Set([
  "firearm",
  "accessory",
  "ammo",
  "build",
]);
const MAX_SIZE = 10 * 1024 * 1024;
const SAFE_ENTITY_ID = /^[a-zA-Z0-9_-]{1,64}$/;

function resolveUploadRoot(): string {
  return process.env.IMAGE_UPLOAD_DIR
    ? path.resolve(process.env.IMAGE_UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

// POST /api/images/upload - Upload an image for an entity
// Accepts multipart form data: file, entityType, entityId
// Saves to /uploads/images/{entityType}s/{entityId}.{ext}
// Returns the URL path.
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

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

    if (!SAFE_ENTITY_ID.test(entityId)) {
      return NextResponse.json(
        { error: "Invalid entityId" },
        { status: 400 }
      );
    }
    const sanitizedEntityId = entityId;

    const entityAccess = await requireEntityWriteAccess(
      request,
      entityType as WritableEntityType,
      sanitizedEntityId
    );
    if (!entityAccess.ok) {
      return entityAccess.response;
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
    const detected = detectFileSignature(buffer);

    if (!detected || !ALLOWED_EXTENSIONS.has(detected.extension)) {
      if (isHeicFamilySignature(buffer) || ["image/heic", "image/heif"].includes(file.type)) {
        return NextResponse.json(
          {
            error: `HEIC/HEIF photos are not supported for Wave 3 uploads. Please export as ${SUPPORTED_IMAGE_FORMATS_LABEL}.`,
          },
          { status: 400 }
        );
      }

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
    const relativeUrl = `/uploads/images/${entityTypeDir}/${fileName}`;

    // Resolve the absolute path outside the web root
    const uploadRoot = resolveUploadRoot();
    const uploadDir = path.join(uploadRoot, "images", entityTypeDir);
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
  } catch {
    console.error("POST /api/images/upload failed");
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
