import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

// Simple in-memory rate limiter for login attempts
// Resets on server restart — acceptable for single-user self-hosted Docker
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string" || password.trim() === "") {
      return NextResponse.json(
        { error: "Password required" },
        { status: 400 }
      );
    }

    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
      select: { appPassword: true, passwordIsHashed: true },
    });

    // No password set yet — first-time setup: accept this password and save it
    if (!settings?.appPassword) {
      const hashed = await hashPassword(password);
      await prisma.appSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", appPassword: hashed, passwordIsHashed: true },
        update: { appPassword: hashed, passwordIsHashed: true },
      });
      resetRateLimit(ip);
      const session = await getSession();
      session.authenticated = true;
      await session.save();
      return NextResponse.json({ ok: true, firstTime: true });
    }

    let valid = false;

    if (!settings.passwordIsHashed) {
      // Legacy: plaintext password in DB — do direct comparison then re-hash
      valid = password === settings.appPassword;
      if (valid) {
        const hashed = await hashPassword(password);
        await prisma.appSettings.update({
          where: { id: "singleton" },
          data: { appPassword: hashed, passwordIsHashed: true },
        });
      }
    } else {
      valid = await verifyPassword(password, settings.appPassword);
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    resetRateLimit(ip);
    const session = await getSession();
    session.authenticated = true;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
