import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";

const ALLOWED_ENTITY_TYPES = ["firearm", "accessory"] as const;
type AllowedEntityType = (typeof ALLOWED_ENTITY_TYPES)[number];

// Allows <entityId>_<timestamp>.<ext> format, blocks path traversal
const SAFE_FILENAME = /^[a-zA-Z0-9_-]{1,100}\.[a-z0-9]{2,5}$/;

function resolveUploadRoot(): string {
  return process.env.IMAGE_UPLOAD_DIR
    ? path.resolve(process.env.IMAGE_UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  const ip = getClientIp(request);
  const rate = await enforceRateLimit({ key: `delete:images:${ip}`, windowMs: 60_000, maxAttempts: 20 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many delete attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  const { searchParams } = request.nextUrl;
  const filename = searchParams.get("filename");
  const entityType = searchParams.get("entityType") as AllowedEntityType | null;
  const entityId = searchParams.get("entityId");

  if (!filename || !entityType || !entityId) {
    return NextResponse.json(
      { error: "Missing required params: filename, entityType, entityId" },
      { status: 400 }
    );
  }

  if (!ALLOWED_ENTITY_TYPES.includes(entityType)) {
    return NextResponse.json(
      { error: "Invalid entityType. Must be firearm or accessory." },
      { status: 400 }
    );
  }

  if (!SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
  }

  // Verify entity exists before touching the filesystem
  const entity =
    entityType === "firearm"
      ? await prisma.firearm.findUnique({ where: { id: entityId }, select: { id: true, imageUrl: true } })
      : await prisma.accessory.findUnique({ where: { id: entityId }, select: { id: true, imageUrl: true } });

  if (!entity) {
    return NextResponse.json({ error: "Entity not found." }, { status: 404 });
  }

  // Resolve file path — mirrors upload route's path construction
  const uploadRoot = resolveUploadRoot();
  const filePath = path.join(uploadRoot, "images", `${entityType}s`, filename);

  // Delete file — tolerate already-gone (ENOENT)
  try {
    await fs.unlink(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Image delete fs error:", err);
      return NextResponse.json({ error: "Failed to delete image file." }, { status: 500 });
    }
  }

  // Clear imageUrl on DB record
  if (entityType === "firearm") {
    await prisma.firearm.update({ where: { id: entityId }, data: { imageUrl: null } });
  } else {
    await prisma.accessory.update({ where: { id: entityId }, data: { imageUrl: null } });
  }

  return NextResponse.json({ success: true });
}
