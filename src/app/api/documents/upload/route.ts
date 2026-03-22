import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing required field: file" }, { status: 400 });
    }

    const safeName = `${Date.now()}-${(file.name || "document").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "documents");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      id: safeName,
      name: file.name,
      url: `/uploads/documents/${safeName}`,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
