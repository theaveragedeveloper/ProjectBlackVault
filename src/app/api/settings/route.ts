import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

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

    // Never expose the password hash or raw key — return only status flags
    return NextResponse.json({
      id: settings.id,
      googleCseApiKey: settings.googleCseApiKey ? "***configured***" : null,
      _googleCseApiKeyIsSet: !!settings.googleCseApiKey,
      googleCseSearchEngineId: settings.googleCseSearchEngineId,
      enableImageSearch: settings.enableImageSearch,
      defaultCurrency: settings.defaultCurrency,
      _passwordIsSet: !!settings.appPassword,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
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
      if (appPassword === null || appPassword === "") {
        updateData.appPassword = null;
        updateData.passwordIsHashed = false;
      } else {
        // Always hash before storing — never store plaintext
        updateData.appPassword = await hashPassword(appPassword);
        updateData.passwordIsHashed = true;
        // Destroy the current session so the user must re-login with new password
        const session = await getSession();
        await session.destroy();
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
      id: settings.id,
      googleCseApiKey: settings.googleCseApiKey ? "***configured***" : null,
      _googleCseApiKeyIsSet: !!settings.googleCseApiKey,
      googleCseSearchEngineId: settings.googleCseSearchEngineId,
      enableImageSearch: settings.enableImageSearch,
      defaultCurrency: settings.defaultCurrency,
      _passwordIsSet: !!settings.appPassword,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
