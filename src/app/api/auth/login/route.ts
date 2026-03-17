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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `auth:login:${ip}`, windowMs: WINDOW_MS, maxAttempts: MAX_ATTEMPTS });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const { password } = await parseJsonBody(request, authSchemas.login, { maxBytes: 8 * 1024 });

    // Guard against DoS via enormous password strings sent to scrypt
    if (typeof password === "string" && password.length > 1024) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "singleton", sessionVersion: 1 } });
    }

    const secret = getSessionSecret();
    if (!secret) {
      console.error("POST /api/auth/login: SESSION_SECRET is not set");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
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
    if (!verifyPassword(password ?? "", settings.appPassword)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = createSessionToken(settings.sessionVersion || 1);
    const cookieValue = signToken(token, secret);
    const cookieStore = await cookies();
    cookieStore.set("vault_session", cookieValue, getSessionCookieOptions());

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error as { status?: number }).status) {
      return validationErrorResponse(error, "Invalid login payload");
    }
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
