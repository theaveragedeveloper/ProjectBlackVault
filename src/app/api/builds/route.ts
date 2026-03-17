import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOptionalImageUrl } from "@/lib/image-url-validation";

// GET /api/builds - List all builds, optional ?firearmId= filter and batched ?firearmIds=id1,id2
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const firearmIdsParam = searchParams.get("firearmIds");
    const firearmIds = firearmIdsParam
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const where = firearmIds?.length
      ? { firearmId: { in: firearmIds } }
      : firearmId
        ? { firearmId }
        : undefined;

    const isBatchedFilter = Boolean(firearmIds?.length);
    const orderBy = [{ isActive: "desc" as const }, { updatedAt: "desc" as const }];

    const builds = isBatchedFilter
      ? await prisma.build.findMany({
          where,
          select: {
            id: true,
            firearmId: true,
            name: true,
            isActive: true,
            sortOrder: true,
            imageUrl: true,
            imageSource: true,
            slots: {
              select: {
                id: true,
                slotType: true,
                accessory: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy,
        })
      : await prisma.build.findMany({
          where,
          include: {
            firearm: {
              select: {
                id: true,
                name: true,
                manufacturer: true,
                model: true,
                type: true,
                caliber: true,
                imageUrl: true,
              },
            },
            slots: {
              include: {
                accessory: true,
              },
            },
          },
          orderBy,
        });

    return NextResponse.json(builds);
  } catch (error) {
    console.error("GET /api/builds error:", error);
    return NextResponse.json(
      { error: "Failed to fetch builds" },
      { status: 500 }
    );
  }
}

// POST /api/builds - Create a new build
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, firearmId, isActive, imageUrl, imageSource } = body;

    const imageValidation = validateOptionalImageUrl(imageUrl);
    if (!imageValidation.valid) {
      return NextResponse.json({ error: imageValidation.error }, { status: 400 });
    }

    if (!name || !firearmId) {
      return NextResponse.json(
        { error: "Missing required fields: name, firearmId" },
        { status: 400 }
      );
    }

    // Verify the firearm exists
    const firearm = await prisma.firearm.findUnique({ where: { id: firearmId } });
    if (!firearm) {
      return NextResponse.json({ error: "Firearm not found" }, { status: 404 });
    }

    // If this build should be active, deactivate all other builds for this firearm
    if (isActive) {
      await prisma.build.updateMany({
        where: { firearmId, isActive: true },
        data: { isActive: false },
      });
    }

    const build = await prisma.build.create({
      data: {
        name,
        description: description ?? null,
        firearmId,
        isActive: isActive ?? false,
        imageUrl: imageValidation.normalized,
        imageSource: imageSource ?? null,
      },
      include: {
        firearm: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            model: true,
            type: true,
            caliber: true,
            imageUrl: true,
          },
        },
        slots: {
          include: {
            accessory: true,
          },
        },
      },
    });

    return NextResponse.json(build, { status: 201 });
  } catch (error) {
    console.error("POST /api/builds error:", error);
    return NextResponse.json(
      { error: "Failed to create build" },
      { status: 500 }
    );
  }
}
