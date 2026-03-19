import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { verifyPassword } from "@/lib/password";
import { getSessionSecret, signToken, SESSION_COOKIE_NAME } from "@/lib/session";

// Simple in-memory rate limiter: max 10 attempts per IP per minute
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= MAX_ATTEMPTS) return false;
  rec.count++;
  return true;
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
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return noStoreJson(
        { error: "Too many login attempts. Please wait a minute." },
        429
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

    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });

    // If no password is set, first-run setup must complete before login.
    if (!settings.appPassword) {
      return noStoreJson(
        { error: "First-run setup is required before login." },
        409
      );
    }

    // Verify password (supports both hashed and legacy plaintext)
    if (!verifyPassword(normalizedPassword, settings.appPassword)) {
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

    return noStoreJson({ success: true });
  } catch (error) {
    console.error("POST /api/auth/login failed", error);
    return noStoreJson({ error: "Authentication failed" }, 500);
  }
}
