import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const firearmId = searchParams.get("firearmId");
  const accessoryId = searchParams.get("accessoryId");
  const type = searchParams.get("type");

  const docs = await prisma.document.findMany({
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

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, fileUrl, fileSize, mimeType, notes, firearmId, accessoryId } = body;

  if (!name || !fileUrl) {
    return NextResponse.json({ error: "name and fileUrl are required" }, { status: 400 });
  }

  const doc = await prisma.document.create({
    data: {
      name,
      type: type || "RECEIPT",
      fileUrl,
      fileSize: fileSize ? Number(fileSize) : null,
      mimeType: mimeType || null,
      notes: notes || null,
      firearmId: firearmId || null,
      accessoryId: accessoryId || null,
    },
    include: {
      firearm: { select: { id: true, name: true } },
      accessory: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
