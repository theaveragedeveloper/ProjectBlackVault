import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SectionFlags = {
  firearms: boolean;
  accessories: boolean;
  builds: boolean;
  ammo: boolean;
  rangeSessions: boolean;
  documents: boolean;
  settings: boolean;
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

function parseBool(value: string | null, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
}

function parseFlags(searchParams: URLSearchParams): SectionFlags {
  return {
    firearms: parseBool(searchParams.get("firearms"), true),
    accessories: parseBool(searchParams.get("accessories"), true),
    builds: parseBool(searchParams.get("builds"), true),
    ammo: parseBool(searchParams.get("ammo"), true),
    rangeSessions: parseBool(searchParams.get("rangeSessions"), true),
    documents: parseBool(searchParams.get("documents"), true),
    settings: parseBool(searchParams.get("settings"), false),
  };
}

export async function GET(request: NextRequest) {
  try {
    const flags = parseFlags(request.nextUrl.searchParams);

    const payload: Record<string, unknown> = {
      meta: {
        exportedAt: new Date().toISOString(),
        sections: flags,
      },
    };

    const queries: Promise<void>[] = [];

    if (flags.firearms) {
      queries.push(
        prisma.firearm.findMany({ orderBy: [{ manufacturer: "asc" }, { model: "asc" }, { name: "asc" }] }).then((rows) => {
          payload.firearms = rows;
        })
      );
    }

    if (flags.accessories) {
      queries.push(
        prisma.accessory.findMany({ orderBy: [{ manufacturer: "asc" }, { name: "asc" }] }).then((rows) => {
          payload.accessories = rows;
        })
      );
    }

    if (flags.builds) {
      queries.push(
        prisma.build.findMany({
          include: {
            slots: {
              include: { accessory: true },
              orderBy: { slotType: "asc" },
            },
          },
          orderBy: [{ firearmId: "asc" }, { name: "asc" }],
        }).then((rows) => {
          payload.builds = rows;
        })
      );
    }

    if (flags.ammo) {
      queries.push(
        prisma.ammoStock.findMany({
          include: {
            transactions: {
              orderBy: { transactedAt: "desc" },
            },
          },
          orderBy: [{ caliber: "asc" }, { brand: "asc" }],
        }).then((rows) => {
          payload.ammoStocks = rows;
        })
      );
    }

    if (flags.rangeSessions) {
      queries.push(
        prisma.rangeSession.findMany({
          include: {
            sessionDrills: { orderBy: { sortOrder: "asc" } },
            ammoLinks: true,
          },
          orderBy: { date: "desc" },
        }).then((rows) => {
          payload.rangeSessions = rows;
        })
      );
    }

    if (flags.documents) {
      queries.push(
        prisma.document.findMany({
          include: {
            firearm: { select: { id: true, name: true } },
            accessory: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        }).then((rows) => {
          payload.documents = rows;
        })
      );
    }

    if (flags.settings) {
      queries.push(
        prisma.appSettings.findUnique({ where: { id: "singleton" } }).then((settings) => {
          if (!settings) {
            payload.settings = null;
            return;
          }
          payload.settings = {
            id: settings.id,
            defaultCurrency: settings.defaultCurrency,
            enableImageSearch: settings.enableImageSearch,
            googleCseSearchEngineId: settings.googleCseSearchEngineId,
            hasGoogleCseApiKey: !!settings.googleCseApiKey,
            hasAppPassword: !!settings.appPassword,
            hasEncryptionKey: !!settings.encryptionKey,
            dataStoragePath: settings.dataStoragePath,
            createdAt: settings.createdAt,
            updatedAt: settings.updatedAt,
          };
        })
      );
    }

    await Promise.all(queries);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/exports/data error:", error);
    return NextResponse.json({ error: "Failed to build export" }, { status: 500 });
  }
}
