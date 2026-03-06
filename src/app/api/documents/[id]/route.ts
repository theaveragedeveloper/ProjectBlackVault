import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      firearm: { select: { id: true, name: true } },
      accessory: { select: { id: true, name: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, type, notes, firearmId, accessoryId } = body;

  const doc = await prisma.document.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(firearmId !== undefined && { firearmId: firearmId || null }),
      ...(accessoryId !== undefined && { accessoryId: accessoryId || null }),
    },
    include: {
      firearm: { select: { id: true, name: true } },
      accessory: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(doc);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
