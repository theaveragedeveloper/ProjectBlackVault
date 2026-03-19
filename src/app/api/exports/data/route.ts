import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ExportFormat = "json" | "csv";

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

function parseFormat(searchParams: URLSearchParams): ExportFormat {
  const format = (searchParams.get("format") ?? "json").trim().toLowerCase();
  if (format === "json" || format === "csv") return format;
  throw new Error("INVALID_FORMAT");
}

function toSerializable(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isFlatObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function flattenObject(
  value: Record<string, unknown>,
  out: Record<string, string>,
  prefix = ""
) {
  for (const [key, raw] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isFlatObject(raw)) {
      flattenObject(raw, out, path);
      continue;
    }
    out[path] = toSerializable(raw);
  }
}

function toCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function buildCsv(sections: { section: string; rows: unknown }[]): string {
  const flattenedRows: Record<string, string>[] = [];

  for (const section of sections) {
    const sourceRows = Array.isArray(section.rows) ? section.rows : [section.rows];
    for (const sourceRow of sourceRows) {
      const row: Record<string, string> = { section: section.section };
      if (isFlatObject(sourceRow)) {
        flattenObject(sourceRow, row);
      } else {
        row.value = toSerializable(sourceRow);
      }
      flattenedRows.push(row);
    }
  }

  if (flattenedRows.length === 0) return "section\n";

  const headers = Array.from(
    flattenedRows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const orderedHeaders = ["section", ...headers.filter((h) => h !== "section").sort()];
  const lines = [
    orderedHeaders.join(","),
    ...flattenedRows.map((row) =>
      orderedHeaders.map((header) => toCsvValue(row[header] ?? "")).join(",")
    ),
  ];

  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const flags = parseFlags(searchParams);
    const format = parseFormat(searchParams);
    const includeSerialNumbers = parseBool(searchParams.get("includeSerialNumbers"), true);

    const payload: Record<string, unknown> = {
      meta: {
        exportedAt: new Date().toISOString(),
        format,
        includeSerialNumbers,
        sections: flags,
      },
    };

    const queries: Promise<void>[] = [];

    if (flags.firearms) {
      queries.push(
        prisma.firearm.findMany({ orderBy: [{ manufacturer: "asc" }, { model: "asc" }, { name: "asc" }] }).then((rows) => {
          payload.firearms = includeSerialNumbers
            ? rows
            : rows.map((row) => {
                const rest = { ...row } as Record<string, unknown>;
                delete rest.serialNumber;
                return rest;
              });
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

    if (format === "csv") {
      const csvSections: { section: string; rows: unknown }[] = [
        {
          section: "meta",
          rows: {
            exportedAt: (payload.meta as { exportedAt: string }).exportedAt,
            format,
            includeSerialNumbers,
            sections: flags,
          },
        },
      ];

      if (flags.firearms) csvSections.push({ section: "firearms", rows: payload.firearms ?? [] });
      if (flags.accessories) csvSections.push({ section: "accessories", rows: payload.accessories ?? [] });
      if (flags.builds) csvSections.push({ section: "builds", rows: payload.builds ?? [] });
      if (flags.ammo) csvSections.push({ section: "ammoStocks", rows: payload.ammoStocks ?? [] });
      if (flags.rangeSessions) csvSections.push({ section: "rangeSessions", rows: payload.rangeSessions ?? [] });
      if (flags.documents) csvSections.push({ section: "documents", rows: payload.documents ?? [] });
      if (flags.settings) csvSections.push({ section: "settings", rows: payload.settings ?? [] });

      const csv = buildCsv(csvSections);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_FORMAT") {
      return NextResponse.json(
        { error: "Invalid format. Supported values: json, csv" },
        { status: 400 }
      );
    }
    console.error("GET /api/exports/data error:", error);
    return NextResponse.json({ error: "Failed to build export" }, { status: 500 });
  }
}
