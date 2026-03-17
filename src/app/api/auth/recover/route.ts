import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { authSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { cookies } from "next/headers";
import { getSessionCookieOptions } from "@/lib/session-config";
import crypto from "crypto";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;

function timingSafeSecretMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function getExpectedRecoverySecret(): string | undefined {
  if (process.env.PASSWORD_RECOVERY_SECRET) {
    return process.env.PASSWORD_RECOVERY_SECRET;
  }

  if (process.env.ALLOW_SESSION_SECRET_PASSWORD_RESET === "true") {
    return process.env.SESSION_SECRET;
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `auth:recover:${ip}`, windowMs: WINDOW_MS, maxAttempts: MAX_ATTEMPTS });
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
    }

    const { recoverySecret, newPassword } = await parseJsonBody(request, authSchemas.recover, { maxBytes: 8 * 1024 });

    const expectedSecret = getExpectedRecoverySecret();
    if (!expectedSecret) {
      return NextResponse.json({ error: "Password recovery is not configured" }, { status: 503 });
    }

    if (!timingSafeSecretMatch(recoverySecret, expectedSecret)) {
      return NextResponse.json({ error: "Invalid recovery credentials" }, { status: 401 });
    }

    const nextPasswordHash = hashPassword(newPassword);
    await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        appPassword: nextPasswordHash,
      },
      update: {
        appPassword: nextPasswordHash,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("vault_session", "", { ...getSessionCookieOptions(), maxAge: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error as { status?: number }).status) {
      return validationErrorResponse(error, "Invalid recovery payload");
    }
    console.error("POST /api/auth/recover error:", error);
    return NextResponse.json({ error: "Password recovery failed" }, { status: 500 });
  }
}
