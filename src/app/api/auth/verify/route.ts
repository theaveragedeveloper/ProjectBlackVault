import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { authSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `auth:verify:${ip}`, windowMs: WINDOW_MS, maxAttempts: MAX_ATTEMPTS });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const { password } = await parseJsonBody(request, authSchemas.login, { maxBytes: 8 * 1024 });

    if (typeof password === "string" && password.length > 1024) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });

    if (!settings?.appPassword) {
      return NextResponse.json({ valid: true });
    }

    const valid = verifyPassword(password ?? "", settings.appPassword);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    if (error instanceof Error && (error as { status?: number }).status) {
      return validationErrorResponse(error, "Invalid payload");
    }
    console.error("POST /api/auth/verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
