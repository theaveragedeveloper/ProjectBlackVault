import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSessionCookieOptions } from "@/lib/session-config";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { requireAuth } from "@/lib/server/auth";

const CURRENCY_RE = /^[A-Z]{3}$/;
const KEY_EXPORT_ENABLED = (process.env.ALLOW_ENCRYPTION_KEY_EXPORT ?? "").trim().toLowerCase() === "true";

// GET /api/settings - Get the singleton AppSettings
export async function GET() {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    // Try to find the singleton settings record
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    // If no settings exist yet, create the default singleton
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: "singleton",
        },
      });
    }

    // Never return password hash to the client
    return NextResponse.json({
      ...settings,
      enableImageSearch: false,
      googleCseApiKey: null,
      _googleCseApiKeyIsSet: false,
      googleCseSearchEngineId: null,
      appPassword: settings.appPassword ? "***set***" : null,
      encryptionEnabled: !!process.env.VAULT_ENCRYPTION_KEY,
      encryptionViaEnv: !!process.env.VAULT_ENCRYPTION_KEY,
    });
  } catch {
    console.error("GET /api/settings failed");
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update the singleton AppSettings
export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    // Rate-limit password change attempts to prevent brute-force via currentPassword
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `settings:password:${ip}`, windowMs: 60_000, maxAttempts: 5 });
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
    }

    const body = await request.json();

    const {
      defaultCurrency,
      appPassword,
      currentPassword,
    } = body;

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = {};

    // Image search is retired; force-disable and clear old Google CSE settings.
    updateData.enableImageSearch = false;
    updateData.googleCseApiKey = null;
    updateData.googleCseSearchEngineId = null;

    if (defaultCurrency !== undefined) {
      if (typeof defaultCurrency !== "string" || !CURRENCY_RE.test(defaultCurrency.trim().toUpperCase())) {
        return NextResponse.json(
          { error: "defaultCurrency must be a 3-letter currency code (e.g. USD)" },
          { status: 400 }
        );
      }
      updateData.defaultCurrency = defaultCurrency.trim().toUpperCase();
    }

    if (appPassword !== undefined) {
      // If a password is already set, the current password must be verified before changing it
      const existing = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
      if (existing?.appPassword) {
        if (typeof currentPassword !== "string" || currentPassword.length === 0) {
          return NextResponse.json({ error: "Current password is required to change the password" }, { status: 403 });
        }
        if (!verifyPassword(currentPassword, existing.appPassword)) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
        }
      }

      if (appPassword === "" || appPassword === null) {
        updateData.appPassword = null;
      } else if (typeof appPassword === "string" && appPassword.length >= 8 && appPassword.length <= 1024) {
        updateData.appPassword = hashPassword(appPassword);
      } else if (typeof appPassword === "string" && appPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
    }

    // Upsert: create the singleton if it doesn't exist, update if it does
    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        ...updateData,
      },
      update: updateData,
    });

    const response = NextResponse.json({
      ...settings,
      enableImageSearch: false,
      googleCseApiKey: null,
      _googleCseApiKeyIsSet: false,
      googleCseSearchEngineId: null,
      appPassword: settings.appPassword ? "***set***" : null,
      encryptionEnabled: !!process.env.VAULT_ENCRYPTION_KEY,
      encryptionViaEnv: !!process.env.VAULT_ENCRYPTION_KEY,
    });

    // Invalidate the current session whenever the password is changed so that
    // any captured/stolen session cookies are immediately rendered useless.
    if (updateData.appPassword !== undefined) {
      const cookieStore = await cookies();
      cookieStore.set("vault_session", "", { ...getSessionCookieOptions(), maxAge: 0 });
    }

    return response;
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
