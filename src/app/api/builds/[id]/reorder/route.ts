import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  } catch {
    return Response.json({ error: "Failed to update sort order" }, { status: 500 });
  }
}
