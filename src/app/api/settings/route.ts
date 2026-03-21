import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const CURRENCY_RE = /^[A-Z]{3}$/;
const KEY_EXPORT_ENABLED = (process.env.ALLOW_ENCRYPTION_KEY_EXPORT ?? "").trim().toLowerCase() === "true";
const MIN_PASSWORD_LENGTH = 8;

// GET /api/settings - Get the singleton AppSettings
export async function GET() {
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

    // Mask the API key in the response — return only whether it's set
    return NextResponse.json({
      ...settings,
      googleCseApiKey: settings.googleCseApiKey ? "***configured***" : null,
      _googleCseApiKeyIsSet: !!settings.googleCseApiKey,
      appPassword: settings.appPassword ? "***set***" : null,
      encryptionEnabled: !!(process.env.VAULT_ENCRYPTION_KEY || settings.encryptionKey),
      encryptionViaEnv: !!process.env.VAULT_ENCRYPTION_KEY,
      encryptionKeyExportEnabled: KEY_EXPORT_ENABLED,
      encryptionKey: undefined, // never expose the raw key
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
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsedBody = typeof body === "object" && body !== null
      ? body as Record<string, unknown>
      : {};

    const {
      googleCseApiKey,
      googleCseSearchEngineId,
      enableImageSearch,
      defaultCurrency,
      appPassword,
    } = parsedBody;

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = {};

    if (googleCseApiKey !== undefined) {
      // Allow clearing the key by passing null or empty string
      if (
        googleCseApiKey !== null &&
        googleCseApiKey !== "" &&
        (typeof googleCseApiKey !== "string" || googleCseApiKey.length > 256)
      ) {
        return NextResponse.json(
          { error: "googleCseApiKey must be a string up to 256 characters" },
          { status: 400 }
        );
      }
      updateData.googleCseApiKey =
        googleCseApiKey === "" ? null : googleCseApiKey;
    }

    if (googleCseSearchEngineId !== undefined) {
      if (
        googleCseSearchEngineId !== null &&
        googleCseSearchEngineId !== "" &&
        (typeof googleCseSearchEngineId !== "string" || googleCseSearchEngineId.length > 128)
      ) {
        return NextResponse.json(
          { error: "googleCseSearchEngineId must be a string up to 128 characters" },
          { status: 400 }
        );
      }
      updateData.googleCseSearchEngineId =
        googleCseSearchEngineId === "" ? null : googleCseSearchEngineId;
    }

    if (enableImageSearch !== undefined) {
      updateData.enableImageSearch = Boolean(enableImageSearch);
    }

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
      if (appPassword === "" || appPassword === null) {
        updateData.appPassword = null;
      } else if (typeof appPassword === "string" && appPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `appPassword must be at least ${MIN_PASSWORD_LENGTH} characters` },
          { status: 400 }
        );
      } else if (typeof appPassword === "string" && appPassword.length <= 1024) {
        updateData.appPassword = hashPassword(appPassword);
      } else {
        return NextResponse.json(
          { error: "appPassword must be a string up to 1024 characters" },
          { status: 400 }
        );
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

    return NextResponse.json({
      ...settings,
      googleCseApiKey: settings.googleCseApiKey ? "***configured***" : null,
      _googleCseApiKeyIsSet: !!settings.googleCseApiKey,
      appPassword: settings.appPassword ? "***set***" : null,
      encryptionEnabled: !!(process.env.VAULT_ENCRYPTION_KEY || settings.encryptionKey),
      encryptionViaEnv: !!process.env.VAULT_ENCRYPTION_KEY,
      encryptionKeyExportEnabled: KEY_EXPORT_ENABLED,
      encryptionKey: undefined,
    });
  } catch {
    console.error("PUT /api/settings failed");
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
