import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSafeDocumentUrl } from "@/lib/upload-security";

const DOC_TYPES = new Set(["RECIPE", "TAX_STAMP", "RECEIPT", "OTHER"]);
const SAFE_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firearmId = searchParams.get("firearmId");
    const accessoryId = searchParams.get("accessoryId");
    const type = searchParams.get("type");

    const normalizedType = type && DOC_TYPES.has(type) ? type : null;
    const safeFirearmId = firearmId && SAFE_ID_RE.test(firearmId) ? firearmId : null;
    const safeAccessoryId = accessoryId && SAFE_ID_RE.test(accessoryId) ? accessoryId : null;

    const documents = await prisma.document.findMany({
      where: {
        ...(safeFirearmId ? { firearmId: safeFirearmId } : {}),
        ...(safeAccessoryId ? { accessoryId: safeAccessoryId } : {}),
        ...(normalizedType ? { type: normalizedType } : {}),
      },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch {
    console.error("GET /api/documents failed");
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const parsedBody = typeof body === "object" && body !== null
      ? body as Record<string, unknown>
      : {};
    const { name, type, fileUrl, fileSize, mimeType, notes, firearmId, accessoryId } = parsedBody;

    if (!name || !fileUrl) {
      return NextResponse.json({ error: "name and fileUrl are required" }, { status: 400 });
    }

    const normalizedName = String(name).trim();
    if (!normalizedName || normalizedName.length > 200) {
      return NextResponse.json({ error: "name must be 1-200 characters" }, { status: 400 });
    }

    const normalizedFileUrl = String(fileUrl).trim();
    if (!isSafeDocumentUrl(normalizedFileUrl)) {
      return NextResponse.json({ error: "fileUrl must point to /uploads/documents/" }, { status: 400 });
    }

    const normalizedType = typeof type === "string" && DOC_TYPES.has(type) ? type : "OTHER";
    const safeFirearmId = typeof firearmId === "string" && SAFE_ID_RE.test(firearmId.trim()) ? firearmId.trim() : null;
    const safeAccessoryId = typeof accessoryId === "string" && SAFE_ID_RE.test(accessoryId.trim()) ? accessoryId.trim() : null;

    const document = await prisma.document.create({
      data: {
        name: normalizedName,
        type: normalizedType,
        fileUrl: normalizedFileUrl,
        fileSize: typeof fileSize === "number" ? Math.max(0, Math.floor(fileSize)) : null,
        mimeType: typeof mimeType === "string" ? mimeType.slice(0, 100) : null,
        notes: typeof notes === "string" && notes.trim().length > 0 ? notes.trim().slice(0, 2000) : null,
        firearmId: safeFirearmId,
        accessoryId: safeAccessoryId,
      },
      include: {
        firearm: { select: { id: true, name: true } },
        accessory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch {
    console.error("POST /api/documents failed");
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
