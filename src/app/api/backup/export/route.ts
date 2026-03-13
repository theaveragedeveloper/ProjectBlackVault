import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { backupSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { collectBackupData } from "@/lib/backup";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rate = await enforceRateLimit({ key: `backup:export:${ip}`, windowMs: 60_000, maxAttempts: 10 });
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const body = await parseJsonBody(request, backupSchemas.export, { maxBytes: 32 * 1024 });
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
    if (error instanceof Error && (error as { status?: number }).status) return validationErrorResponse(error);
    console.error("POST /api/backup/export error:", error);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}
