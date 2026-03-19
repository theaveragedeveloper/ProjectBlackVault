import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

// GET /uploads/[...path] - Serve uploaded media from IMAGE_UPLOAD_DIR or ./uploads
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: rawPath } = await params;
    const segments = Array.isArray(rawPath) ? rawPath : [];
    if (segments.length < 2 || !segments.every((seg) => SAFE_SEGMENT.test(seg))) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const uploadRoot = process.env.IMAGE_UPLOAD_DIR
      ? path.resolve(process.env.IMAGE_UPLOAD_DIR)
      : path.join(process.cwd(), "uploads");
    const absoluteRoot = path.resolve(uploadRoot);
    const filePath = path.resolve(absoluteRoot, ...segments);

    if (!filePath.startsWith(`${absoluteRoot}${path.sep}`)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
