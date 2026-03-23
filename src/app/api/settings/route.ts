import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_AUTO_BACKUP_CADENCE = new Set(["daily", "weekly", "monthly"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBooleanField(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) return null;
  return normalized;
}

// GET /api/settings - Get the singleton AppSettings
export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: "singleton",
        },
      });
    }

    const v1Settings = {
      id: settings.id,
      includeUploadsInBackup: settings.includeUploadsInBackup,
      autoBackupEnabled: settings.autoBackupEnabled,
      autoBackupCadence: settings.autoBackupCadence,
      defaultCurrency: settings.defaultCurrency,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    return NextResponse.json({
      ...v1Settings,
      appPassword: null,
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
    const body = await request.json().catch(() => null);
    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid JSON body. Expected an object payload." },
        { status: 400 }
      );
    }

    const {
      includeUploadsInBackup,
      autoBackupEnabled,
      autoBackupCadence,
      defaultCurrency,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (includeUploadsInBackup !== undefined) {
      const parsed = parseBooleanField(includeUploadsInBackup);
      if (parsed == null) {
        return NextResponse.json(
          { error: "includeUploadsInBackup must be a boolean." },
          { status: 400 }
        );
      }
      updateData.includeUploadsInBackup = parsed;
    }

    if (autoBackupEnabled !== undefined) {
      const parsed = parseBooleanField(autoBackupEnabled);
      if (parsed == null) {
        return NextResponse.json(
          { error: "autoBackupEnabled must be a boolean." },
          { status: 400 }
        );
      }
      updateData.autoBackupEnabled = parsed;
    }

    if (autoBackupCadence !== undefined) {
      if (typeof autoBackupCadence !== "string") {
        return NextResponse.json(
          { error: "autoBackupCadence must be a string value." },
          { status: 400 }
        );
      }
      const cadence = String(autoBackupCadence).trim().toLowerCase();
      if (!ALLOWED_AUTO_BACKUP_CADENCE.has(cadence)) {
        return NextResponse.json(
          { error: "Invalid auto backup cadence. Use daily, weekly, or monthly." },
          { status: 400 }
        );
      }
      updateData.autoBackupCadence = cadence;
    }

    if (defaultCurrency !== undefined) {
      const normalized = normalizeCurrency(defaultCurrency);
      if (normalized == null) {
        return NextResponse.json(
          { error: "defaultCurrency must be a 3-letter currency code." },
          { status: 400 }
        );
      }
      updateData.defaultCurrency = normalized;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid settings fields provided." },
        { status: 400 }
      );
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        ...updateData,
      },
      update: updateData,
    });

    const v1Settings = {
      id: settings.id,
      includeUploadsInBackup: settings.includeUploadsInBackup,
      autoBackupEnabled: settings.autoBackupEnabled,
      autoBackupCadence: settings.autoBackupCadence,
      defaultCurrency: settings.defaultCurrency,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };

    return NextResponse.json({
      ...v1Settings,
      appPassword: null,
    });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
