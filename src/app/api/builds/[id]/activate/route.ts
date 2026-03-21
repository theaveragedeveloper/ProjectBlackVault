import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/builds/[id]/activate - Set build as active, deactivate others for same firearm
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const build = await prisma.build.findUnique({ where: { id } });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    // Use a transaction to atomically deactivate all other builds and activate this one
    const [, activatedBuild] = await prisma.$transaction([
      prisma.build.updateMany({
        where: {
          firearmId: build.firearmId,
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      }),
      prisma.build.update({
        where: { id },
        data: { isActive: true },
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
      }),
    ]);

    return NextResponse.json(activatedBuild);
  } catch (error) {
    console.error("POST /api/builds/[id]/activate error:", error);
    return NextResponse.json(
      { error: "Failed to activate build" },
      { status: 500 }
    );
  }
}
