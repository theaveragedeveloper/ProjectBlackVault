import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { verifyPassword } from "@/lib/password";
import { getSessionSecret, signToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { hasVaultPassword } from "@/lib/auth-state";
import { toStorageStartupError } from "@/lib/user-facing-errors";

// Simple in-memory rate limiter: max 10 attempts per IP per minute
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function checkRateLimit(bucketKey: string): boolean {
  const now = Date.now();
  for (const [existingKey, value] of attempts.entries()) {
    if (now > value.resetAt) {
      attempts.delete(existingKey);
    }
  }
  const rec = attempts.get(bucketKey);
  if (!rec || now > rec.resetAt) {
    attempts.set(bucketKey, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= MAX_ATTEMPTS) return false;
  rec.count++;
  return true;
}

function noStoreJson(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(extraHeaders ?? {}),
    },
  });
}

function getRateLimitKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.slice(0, 80) ?? "unknown-ua";
  const source = forwardedFor || realIp || cfIp || "unknown-ip";
  return `${source}|${userAgent}`;
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
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return noStoreJson(
        { error: "Too many login attempts. Please wait a minute." },
        429,
        { "Retry-After": "60" }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return noStoreJson({ error: "Invalid request body" }, 400);
    }
    const parsedBody = typeof body === "object" && body !== null
      ? body as Record<string, unknown>
      : {};
    const password = parsedBody.password;
    const normalizedPassword = typeof password === "string" ? password : "";
    if (!normalizedPassword) {
      return noStoreJson({ error: "Vault password is required." }, 400);
    }

    const sessionSecret = getSessionSecret();
    if (!sessionSecret) {
      return noStoreJson(
        { error: "Authentication service is unavailable." },
        503
      );
    }

    // Guard against DoS via enormous password strings sent to scrypt
    if (normalizedPassword.length > 1024) {
      return noStoreJson({ error: "Invalid password" }, 401);
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
      select: { appPassword: true },
    });

    const storedPassword = settings?.appPassword ?? null;

    // If no password is set, first-run setup must complete before login.
    if (!hasVaultPassword(storedPassword)) {
      return noStoreJson(
        { error: "First-run setup is required before login." },
        409
      );
    }

    // Verify password (supports both hashed and legacy plaintext)
    if (!verifyPassword(normalizedPassword, storedPassword)) {
      return noStoreJson({ error: "Invalid password" }, 401);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const cookieValue = signToken(token, sessionSecret);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: shouldUseSecureCookie(request),
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    attempts.delete(rateLimitKey);
    return noStoreJson({ success: true });
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    const mapped = toStorageStartupError(error, "Authentication failed. Please try again.");
    return noStoreJson({ error: mapped.error }, mapped.status);
  }
}
