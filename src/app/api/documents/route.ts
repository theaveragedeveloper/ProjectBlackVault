import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "documents");
    await fs.mkdir(uploadsDir, { recursive: true });

    const files = await fs.readdir(uploadsDir, { withFileTypes: true });
    const docs = await Promise.all(
      files
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const stat = await fs.stat(path.join(uploadsDir, entry.name));
          return {
            id: entry.name,
            name: entry.name,
            url: `/uploads/documents/${entry.name}`,
            size: stat.size,
            updatedAt: stat.mtime.toISOString(),
          };
        })
    );

    docs.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return NextResponse.json({ documents: docs });
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
