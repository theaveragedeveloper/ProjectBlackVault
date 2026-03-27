import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: {
      sessionDate?: Date;
      location?: string;
      firearmId?: string;
      buildId?: string | null;
      roundsFired?: number;
      notes?: string | null;
    } = {};

    if (body.sessionDate !== undefined) {
      if (typeof body.sessionDate !== "string" || body.sessionDate.trim().length === 0) {
        return NextResponse.json({ error: "sessionDate must be a valid date string" }, { status: 400 });
      }
      const parsed = new Date(body.sessionDate);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "sessionDate must be a valid date string" }, { status: 400 });
      }
      updateData.sessionDate = parsed;
    }

    if (body.location !== undefined) {
      if (typeof body.location !== "string") {
        return NextResponse.json({ error: "location must be a string" }, { status: 400 });
      }
      updateData.location = body.location.trim() || "Unspecified location";
    }

    if (body.firearmId !== undefined) {
      if (typeof body.firearmId !== "string" || body.firearmId.trim().length === 0) {
        return NextResponse.json({ error: "firearmId must be a non-empty string" }, { status: 400 });
      }
      updateData.firearmId = body.firearmId;
    }

    if (body.buildId !== undefined) {
      if (body.buildId !== null && typeof body.buildId !== "string") {
        return NextResponse.json({ error: "buildId must be a string or null" }, { status: 400 });
      }
      updateData.buildId = body.buildId && body.buildId.trim().length > 0 ? body.buildId : null;
    }

    if (body.roundsFired !== undefined) {
      if (typeof body.roundsFired !== "number" || !Number.isInteger(body.roundsFired) || body.roundsFired < 0) {
        return NextResponse.json({ error: "roundsFired must be a non-negative integer" }, { status: 400 });
      }
      updateData.roundsFired = body.roundsFired;
    }

    if (body.notes !== undefined) {
      if (body.notes !== null && typeof body.notes !== "string") {
        return NextResponse.json({ error: "notes must be a string or null" }, { status: 400 });
      }
      updateData.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    const existing = await prisma.rangeSession.findUnique({
      where: { id },
      select: { id: true, firearmId: true, buildId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Range session not found" }, { status: 404 });
    }

    const resolvedFirearmId = updateData.firearmId ?? existing.firearmId;
    const resolvedBuildId = updateData.buildId !== undefined ? updateData.buildId : existing.buildId;

    const firearm = await prisma.firearm.findUnique({ where: { id: resolvedFirearmId }, select: { id: true } });
    if (!firearm) {
      return NextResponse.json({ error: "Firearm not found" }, { status: 404 });
    }

    if (resolvedBuildId) {
      const build = await prisma.build.findUnique({ where: { id: resolvedBuildId }, select: { firearmId: true } });
      if (!build) {
        return NextResponse.json({ error: "Build not found" }, { status: 404 });
      }
      if (build.firearmId !== resolvedFirearmId) {
        return NextResponse.json(
          { error: "Selected build does not belong to the selected firearm" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.rangeSession.update({
      where: { id },
      data: updateData,
      include: {
        firearm: { select: { id: true, name: true, caliber: true } },
        build: { select: { id: true, name: true } },
        ammoLinks: {
          include: {
            ammoStock: {
              select: { id: true, caliber: true, brand: true, grainWeight: true, bulletType: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        sessionDrills: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { setNumber: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/range/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to update range session" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;

    const existing = await prisma.rangeSession.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Range session not found" }, { status: 404 });
    }

    // Cascade deletes sessionDrills and ammoLinks via schema relations
    await prisma.rangeSession.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/range/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete range session" }, { status: 500 });
  }
}
