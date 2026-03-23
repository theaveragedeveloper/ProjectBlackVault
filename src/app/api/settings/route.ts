import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const {
      googleCseApiKey: _googleCseApiKey,
      googleCseSearchEngineId: _googleCseSearchEngineId,
      enableImageSearch: _enableImageSearch,
      ...v1Settings
    } = settings;

    return NextResponse.json({
      ...v1Settings,
      encryptionEnabled: !!process.env.VAULT_ENCRYPTION_KEY,
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
      includeUploadsInBackup,
      autoBackupEnabled,
      autoBackupCadence,
      defaultCurrency,
      appPassword,
    } = body;

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = {};

    if (includeUploadsInBackup !== undefined) {
      updateData.includeUploadsInBackup = Boolean(includeUploadsInBackup);
    }

    if (autoBackupEnabled !== undefined) {
      updateData.autoBackupEnabled = Boolean(autoBackupEnabled);
    }

    if (autoBackupCadence !== undefined) {
      const cadence = String(autoBackupCadence).trim().toLowerCase();
      const allowed = new Set(["daily", "weekly", "monthly"]);
      if (!allowed.has(cadence)) {
        return NextResponse.json(
          { error: "Invalid auto backup cadence. Use daily, weekly, or monthly." },
          { status: 400 }
        );
      }
      updateData.autoBackupCadence = cadence;
    }

    if (defaultCurrency !== undefined) {
      updateData.defaultCurrency = defaultCurrency;
    }

    if (appPassword !== undefined) {
      updateData.appPassword = appPassword === "" ? null : appPassword;
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

    const {
      googleCseApiKey: _googleCseApiKey,
      googleCseSearchEngineId: _googleCseSearchEngineId,
      enableImageSearch: _enableImageSearch,
      ...v1Settings
    } = settings;

    return NextResponse.json(v1Settings);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
