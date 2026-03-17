import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { authSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { getSessionCookieOptions } from "@/lib/session-config";

const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000;

function getExpectedRecoverySecret(): string | null {
  const recoverySecret = process.env.PASSWORD_RECOVERY_SECRET;
  if (recoverySecret) {
    return recoverySecret;
  }

  const allowSessionSecretFallback = process.env.ALLOW_SESSION_SECRET_PASSWORD_RESET === "true";
  if (!allowSessionSecretFallback) {
    return null;
  }

  return process.env.SESSION_SECRET ?? null;
}

function timingSafeSecretMatch(providedSecret: string, expectedSecret: string): boolean {
  const provided = Buffer.from(providedSecret, "utf8");
  const expected = Buffer.from(expectedSecret, "utf8");

  if (provided.byteLength !== expected.byteLength) {
    return false;
  }

  return crypto.timingSafeEqual(provided, expected);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `auth:recover:${ip}`, windowMs: WINDOW_MS, maxAttempts: MAX_ATTEMPTS });
    if (!rate.allowed) {
      return NextResponse.json({ error: "Recovery failed" }, { status: 400 });
    }

    const { recoverySecret, newPassword } = await parseJsonBody(request, authSchemas.recover, { maxBytes: 8 * 1024 });

    const expectedSecret = getExpectedRecoverySecret();
    if (!expectedSecret || !timingSafeSecretMatch(recoverySecret, expectedSecret)) {
      return NextResponse.json({ error: "Recovery failed" }, { status: 400 });
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        appPassword: hashPassword(newPassword),
        sessionVersion: 2,
      },
      update: {
        appPassword: hashPassword(newPassword),
        sessionVersion: { increment: 1 },
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("vault_session", "", { ...getSessionCookieOptions(), maxAge: 0 });

    return NextResponse.json({ success: true, sessionVersion: settings.sessionVersion });
  } catch (error) {
    if (error instanceof Error && (error as { status?: number }).status) {
      return validationErrorResponse(error, "Recovery failed");
    }

    console.error("POST /api/auth/recover error:", error);
    return NextResponse.json({ error: "Recovery failed" }, { status: 400 });
  }
}
