import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DOC_TYPES = new Set(["RECIPE", "TAX_STAMP", "RECEIPT", "OTHER"]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const accessoryId = searchParams.get("accessoryId");
    const type = searchParams.get("type");

    const documents = await prisma.document.findMany({
      where: {
        ...(firearmId ? { firearmId } : {}),
        ...(accessoryId ? { accessoryId } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, fileUrl, fileSize, mimeType, notes, firearmId, accessoryId } = body ?? {};

    if (!name || !fileUrl) {
      return NextResponse.json({ error: "name and fileUrl are required" }, { status: 400 });
    }

    const normalizedType = typeof type === "string" && DOC_TYPES.has(type) ? type : "OTHER";

    const document = await prisma.document.create({
      data: {
        name: String(name).slice(0, 200),
        type: normalizedType,
        fileUrl: String(fileUrl),
        fileSize: typeof fileSize === "number" ? Math.max(0, Math.floor(fileSize)) : null,
        mimeType: typeof mimeType === "string" ? mimeType : null,
        notes: typeof notes === "string" && notes.trim().length > 0 ? notes.trim().slice(0, 2000) : null,
        firearmId: typeof firearmId === "string" && firearmId.trim() ? firearmId : null,
        accessoryId: typeof accessoryId === "string" && accessoryId.trim() ? accessoryId : null,
      },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
