import { NextRequest, NextResponse } from "next/server";
import { collectBackupData } from "@/lib/backup";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const includeDocumentFiles = body?.includeDocumentFiles !== false;

    const data = await collectBackupData(includeDocumentFiles);

    const backup = {
      meta: {
        app: "ProjectBlackVault",
        formatVersion: 1,
        generatedAt: new Date().toISOString(),
        includeDocumentFiles,
      },
      data,
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error("POST /api/backup/export error:", error);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}
