import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { backupSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { collectBackupData } from "@/lib/backup";
import { requireStepUpAuth } from "@/lib/server/step-up-auth";
import { requireAuth } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const stepUp = await requireStepUpAuth(request);
    if (stepUp) return stepUp;

    const ip = getClientIp(request);
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
