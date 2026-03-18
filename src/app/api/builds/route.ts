import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/builds - List all builds, optional ?firearmId= filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");

    const builds = await prisma.build.findMany({
      where: firearmId ? { firearmId } : undefined,
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
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
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
    const { name, description, firearmId, isActive, status } = body;

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
        status: status ?? 'in-progress',
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
