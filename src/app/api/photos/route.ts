import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { detectFileSignature, isHeicFamilySignature } from "@/lib/server/file-signatures";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { requireAuth } from "@/lib/server/auth";

const ALLOWED_EXTENSIONS = new Set(["jpg", "png", "webp", "avif"]);

const ALLOWED_ENTITY_TYPES = new Set([
  "firearm",
  "accessory",
  "ammo",
  "build",
]);

async function syncEntityPrimaryPhoto(
  entityType: string,
  entityId: string,
  url: string | null
) {
  const data = { imageUrl: url, imageSource: url ? "uploaded" : null };
  if (entityType === "firearm") {
    await prisma.firearm.update({ where: { id: entityId }, data });
  } else if (entityType === "accessory") {
    await prisma.accessory.update({ where: { id: entityId }, data });
  } else if (entityType === "build") {
    await prisma.build.update({ where: { id: entityId }, data });
  }
}

// GET /api/photos?entityType=X&entityId=Y
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { searchParams } = request.nextUrl;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing required query params: entityType, entityId" },
        { status: 400 }
      );
    }

    if (!ALLOWED_ENTITY_TYPES.has(entityType)) {
      return NextResponse.json(
        { error: `Invalid entityType. Must be one of: ${Array.from(ALLOWED_ENTITY_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    const photos = await prisma.photo.findMany({
      where: { entityType, entityId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("GET /api/photos error:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

// POST /api/photos - upload file and create Photo record
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({
      key: `upload:photos:${ip}`,
      windowMs: 60_000,
      maxAttempts: 20,
    });
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
      return NextResponse.json({ error: "Missing required field: file" }, { status: 400 });
    }
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId" },
        { status: 400 }
      );
    }
    if (!ALLOWED_ENTITY_TYPES.has(entityType)) {
      return NextResponse.json(
        { error: `Invalid entityType. Must be one of: ${Array.from(ALLOWED_ENTITY_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    const sanitizedEntityId = entityId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedEntityId) {
      return NextResponse.json({ error: "Invalid entityId" }, { status: 400 });
    }

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
      if (isHeicFamilySignature(buffer) || ["image/heic", "image/heif"].includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "HEIC/HEIF photos must be converted before upload. Please try again from a supported browser to auto-convert, or export as JPG/WebP.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error: `Invalid file type. Only raster formats are allowed: ${Array.from(ALLOWED_EXTENSIONS).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const entityTypeDir = `${entityType}s`;
    const fileName = `${sanitizedEntityId}_${Date.now()}.${detected.extension}`;
    const relativeUrl = `/api/files/images/${entityTypeDir}/${fileName}`;

    const projectRoot = process.cwd();
    const uploadDir = path.join(projectRoot, "storage", "uploads", "images", entityTypeDir);
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    // Determine if this is the first photo for the entity
    const existingCount = await prisma.photo.count({
      where: { entityType, entityId: sanitizedEntityId },
    });
    const isPrimary = existingCount === 0;

    const photo = await prisma.photo.create({
      data: {
        entityType,
        entityId: sanitizedEntityId,
        url: relativeUrl,
        source: "uploaded",
        isPrimary,
      },
    });

    // If first photo, sync entity's imageUrl
    if (isPrimary) {
      await syncEntityPrimaryPhoto(entityType, sanitizedEntityId, relativeUrl);
    }

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("POST /api/photos error:", error);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}

export { syncEntityPrimaryPhoto };
