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
      defaultCurrency,
      appPassword,
    } = body;

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = {};

    // Image search is retired; force-disable and clear old Google CSE settings.
    updateData.enableImageSearch = false;
    updateData.googleCseApiKey = null;
    updateData.googleCseSearchEngineId = null;

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
      enableImageSearch: false,
      googleCseApiKey: null,
      _googleCseApiKeyIsSet: false,
      googleCseSearchEngineId: null,
      appPassword: settings.appPassword ? "***set***" : null,
      encryptionEnabled: !!process.env.VAULT_ENCRYPTION_KEY,
      encryptionViaEnv: !!process.env.VAULT_ENCRYPTION_KEY,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
