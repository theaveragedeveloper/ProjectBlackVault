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
    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[extension];

    if (!contentType) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (!filePath.startsWith(`${absoluteRoot}${path.sep}`)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const stat = await fs.lstat(filePath);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const realRoot = await fs.realpath(absoluteRoot);
    const realFilePath = await fs.realpath(filePath);
    if (!realFilePath.startsWith(`${realRoot}${path.sep}`)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const file = await fs.readFile(filePath);

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
