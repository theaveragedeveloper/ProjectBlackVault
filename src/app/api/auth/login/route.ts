import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, signToken } from "@/lib/session";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { authSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionCookieOptions, getSessionSecret } from "@/lib/session-config";
import { getClientIp } from "@/lib/server/client-ip";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;
const MAX_TRACKED_IPS = 5000;

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

function noStoreJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function shouldUseSecureCookie(request: NextRequest): boolean {
  const override = (process.env.SESSION_COOKIE_SECURE ?? "auto").trim().toLowerCase();
  if (override === "true" || override === "1" || override === "yes") return true;
  if (override === "false" || override === "0" || override === "no") return false;

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    ?.toLowerCase();
  if (forwardedProto) return forwardedProto === "https";
  return request.nextUrl.protocol === "https:";
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Server is not configured for authentication. Missing SESSION_SECRET." },
        { status: 503 }
      );
    }

    // Rate limiting
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `auth:login:${ip}`, windowMs: WINDOW_MS, maxAttempts: MAX_ATTEMPTS });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute." },
        429
      );
    }

    const { password } = await parseJsonBody(request, authSchemas.login, { maxBytes: 8 * 1024 });

    // Guard against DoS via enormous password strings sent to scrypt
    if (normalizedPassword.length > 1024) {
      return noStoreJson({ error: "Invalid password" }, 401);
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
      select: { appPassword: true },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "singleton", sessionVersion: 1 } });
    }

    // If no password is set, always allow access
    if (!settings.appPassword) {
      const token = createSessionToken(settings.sessionVersion || 1);
      const cookieValue = signToken(token, secret);
      const cookieStore = await cookies();
      cookieStore.set("vault_session", cookieValue, getSessionCookieOptions());
      return NextResponse.json({ success: true });
    }

    // Verify password (supports both hashed and legacy plaintext)
    if (!verifyPassword(normalizedPassword, storedPassword)) {
      return noStoreJson({ error: "Invalid password" }, 401);
    }

    const token = createSessionToken(settings.sessionVersion || 1);
    const cookieValue = signToken(token, secret);
    const cookieStore = await cookies();
    cookieStore.set("vault_session", cookieValue, getSessionCookieOptions());

    return noStoreJson({ success: true });
  } catch (error) {
    if (error instanceof Error && (error as { status?: number }).status) {
      return validationErrorResponse(error, "Invalid login payload");
    }
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
