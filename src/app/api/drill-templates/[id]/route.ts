import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/drill-templates/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, category, scoringType, parTime, maxScore } = body;

    const existing = await prisma.drillTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    if (existing.isBuiltIn) {
      return NextResponse.json({ error: "Cannot modify built-in templates" }, { status: 403 });
    }

    const template = await prisma.drillTemplate.update({
      where: { id },
      data: {
        name: typeof name === "string" ? name.slice(0, 200) : undefined,
        description: typeof description === "string" ? description.slice(0, 1000) : null,
        category: typeof category === "string" ? category : undefined,
        scoringType: typeof scoringType === "string" ? scoringType : undefined,
        parTime: parTime != null ? parseFloat(String(parTime)) : null,
        maxScore: maxScore != null ? parseInt(String(maxScore), 10) : null,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("PUT /api/drill-templates/[id] error:", error);
    return NextResponse.json({ error: "Failed to update drill template" }, { status: 500 });
  }
}

// DELETE /api/drill-templates/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.drillTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    if (existing.isBuiltIn) {
      return NextResponse.json({ error: "Cannot delete built-in templates" }, { status: 403 });
    }

    await prisma.drillTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/drill-templates/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete drill template" }, { status: 500 });
  }
}
