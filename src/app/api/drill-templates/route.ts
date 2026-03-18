import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

// GET /api/drill-templates - List all drill templates
export async function GET() {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const templates = await prisma.drillTemplate.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET /api/drill-templates error:", error);
    return NextResponse.json({ error: "Failed to fetch drill templates" }, { status: 500 });
  }
}

// POST /api/drill-templates - Create a custom drill template
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const body = await request.json();
    const { name, description, category, scoringType, parTime, maxScore } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const template = await prisma.drillTemplate.create({
      data: {
        name: String(name).slice(0, 200),
        description: typeof description === "string" && description ? description.slice(0, 1000) : null,
        category: typeof category === "string" ? category : "CUSTOM",
        scoringType: typeof scoringType === "string" ? scoringType : "NOTES_ONLY",
        parTime: parTime != null ? parseFloat(String(parTime)) : null,
        maxScore: maxScore != null ? parseInt(String(maxScore), 10) : null,
        isBuiltIn: false,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("POST /api/drill-templates error:", error);
    return NextResponse.json({ error: "Failed to create drill template" }, { status: 500 });
  }
}
