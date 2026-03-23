import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { basename } from "path";
import { requireAuth } from "@/lib/server/auth";
import { resolveDocumentStoragePath } from "@/lib/upload-security";

function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { fileName } = await params;
    const safeName = basename(fileName);
    const fileUrl = `/api/files/documents/${safeName}`;
    const filePath = resolveDocumentStoragePath(fileUrl);

    if (!filePath) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": guessMimeType(safeName),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    console.error("GET /api/files/documents/[fileName] error:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
