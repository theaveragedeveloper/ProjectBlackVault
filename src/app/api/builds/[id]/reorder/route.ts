import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { id } = await params;
    const { sortOrder } = await req.json();
    if (typeof sortOrder !== "number") {
      return Response.json({ error: "sortOrder must be a number" }, { status: 400 });
    }
    const build = await prisma.build.update({
      where: { id },
      data: { sortOrder },
    });
    return Response.json(build);
  } catch (error) {
    const isNotFound = typeof error === "object" && error !== null && (error as { code?: string }).code === "P2025";
    if (isNotFound) return Response.json({ error: "Build not found" }, { status: 404 });
    return Response.json({ error: "Failed to update sort order" }, { status: 500 });
  }
}
