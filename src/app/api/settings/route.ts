import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

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
      encryptionKey: undefined, // never expose the raw key
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update the singleton AppSettings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      googleCseApiKey,
      googleCseSearchEngineId,
      enableImageSearch,
      defaultCurrency,
      appPassword,
    } = body;

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = {};

    if (googleCseApiKey !== undefined) {
      // Allow clearing the key by passing null or empty string
      updateData.googleCseApiKey =
        googleCseApiKey === "" ? null : googleCseApiKey;
    }

    if (googleCseSearchEngineId !== undefined) {
      updateData.googleCseSearchEngineId =
        googleCseSearchEngineId === "" ? null : googleCseSearchEngineId;
    }

    if (enableImageSearch !== undefined) {
      updateData.enableImageSearch = Boolean(enableImageSearch);
    }

    if (defaultCurrency !== undefined) {
      updateData.defaultCurrency = defaultCurrency;
    }

    if (appPassword !== undefined) {
      if (appPassword === "" || appPassword === null) {
        updateData.appPassword = null;
      } else if (typeof appPassword === "string" && appPassword.length <= 1024) {
        updateData.appPassword = hashPassword(appPassword);
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
      encryptionKey: undefined,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
