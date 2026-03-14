import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
};

const ROOT_UPLOAD_PATH = path.join(process.cwd(), "storage", "uploads");

function isSafeSegment(segment: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(segment) && !segment.includes("..");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ segments: string[] }> }
) {
  try {
    const { segments } = await params;
    if (!Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    if (segments.some((segment) => !isSafeSegment(segment))) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const normalizedRelativePath = path.normalize(path.join(...segments));
    const resolvedPath = path.resolve(ROOT_UPLOAD_PATH, normalizedRelativePath);

    if (!resolvedPath.startsWith(ROOT_UPLOAD_PATH + path.sep)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const ext = path.extname(resolvedPath).slice(1).toLowerCase();
    const mimeType = MIME_BY_EXTENSION[ext];

    if (!mimeType) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const data = await fs.readFile(resolvedPath);
    const filename = path.basename(resolvedPath);
    const download = request.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    console.error("GET /api/files error:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}
