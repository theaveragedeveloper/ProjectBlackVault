import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { verifyPassword } from "@/lib/password";
import { signToken } from "@/lib/session";

// Simple in-memory rate limiter: max 10 attempts per IP per minute
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000;

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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    // Guard against DoS via enormous password strings sent to scrypt
    if (typeof password === "string" && password.length > 1024) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "singleton" } });
    }

    // If no password is set, always allow access
    if (!settings.appPassword) {
      const token = crypto.randomBytes(32).toString("hex");
      const secret = process.env.SESSION_SECRET;
      const cookieValue = secret ? signToken(token, secret) : token;
      const cookieStore = await cookies();
      cookieStore.set("vault_session", cookieValue, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return NextResponse.json({ success: true });
    }

    // Verify password (supports both hashed and legacy plaintext)
    if (!verifyPassword(password ?? "", settings.appPassword)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const secret = process.env.SESSION_SECRET;
    const cookieValue = secret ? signToken(token, secret) : token;
    const cookieStore = await cookies();
    cookieStore.set("vault_session", cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
