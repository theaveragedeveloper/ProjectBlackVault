import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

function resolveUploadPath(url: string): string | null {
  // URL format: /api/files/images/{entityTypeDir}/{fileName}
  const prefix = "/api/files/";
  if (!url.startsWith(prefix)) return null;
  const relative = url.slice(prefix.length); // e.g. "images/firearms/abc_123.jpg"
  const projectRoot = process.cwd();
  const resolved = path.resolve(
    path.join(projectRoot, "storage", "uploads"),
    relative
  );
  // Safety check: must stay within uploads dir
  const uploadsRoot = path.join(projectRoot, "storage", "uploads");
  if (!resolved.startsWith(uploadsRoot + path.sep)) return null;
  return resolved;
}

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

// DELETE /api/photos/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Delete the physical file (best-effort — don't fail if file is missing)
    const filePath = resolveUploadPath(photo.url);
    if (filePath) {
      await fs.unlink(filePath).catch(() => undefined);
    }

    await prisma.photo.delete({ where: { id } });

    // If the deleted photo was primary, promote the oldest remaining photo
    if (photo.isPrimary) {
      const next = await prisma.photo.findFirst({
        where: { entityType: photo.entityType, entityId: photo.entityId },
        orderBy: { createdAt: "asc" },
      });

      if (next) {
        await prisma.photo.update({ where: { id: next.id }, data: { isPrimary: true } });
        await syncEntityPrimaryPhoto(photo.entityType, photo.entityId, next.url);
      } else {
        // No photos left — clear entity imageUrl
        await syncEntityPrimaryPhoto(photo.entityType, photo.entityId, null);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/photos/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
