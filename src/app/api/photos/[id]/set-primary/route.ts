import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// POST /api/photos/[id]/set-primary
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.isPrimary) {
      // Already primary — return current list
      const photos = await prisma.photo.findMany({
        where: { entityType: photo.entityType, entityId: photo.entityId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      });
      return NextResponse.json(photos);
    }

    // Demote all others, promote this one
    await prisma.photo.updateMany({
      where: { entityType: photo.entityType, entityId: photo.entityId },
      data: { isPrimary: false },
    });
    await prisma.photo.update({ where: { id }, data: { isPrimary: true } });

    // Sync entity's imageUrl
    await syncEntityPrimaryPhoto(photo.entityType, photo.entityId, photo.url);

    const photos = await prisma.photo.findMany({
      where: { entityType: photo.entityType, entityId: photo.entityId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error("POST /api/photos/[id]/set-primary error:", error);
    return NextResponse.json({ error: "Failed to set primary photo" }, { status: 500 });
  }
}
