import { NextRequest, NextResponse } from "next/server";
import { buildArmoryRows, rowsToCsv } from "@/lib/exports/full-armory";
import { DEFAULT_EXPORT_FIELDS } from "@/lib/exports/full-armory-fields";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const format = body.format === "json" ? "json" : "csv";
    const requestedFields = Array.isArray(body.fields) ? body.fields.filter((v: unknown): v is string => typeof v === "string") : [];
    const fields = requestedFields.length > 0 ? requestedFields : [...DEFAULT_EXPORT_FIELDS];

    const rows = await buildArmoryRows(fields);

    if (format === "json") {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="full-armory-export.json"',
        },
      });
    }

    const csv = rowsToCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="full-armory-export.csv"',
      },
    });
  } catch (error) {
    console.error("POST /api/exports/full-armory error:", error);
    return NextResponse.json({ error: "Failed to export armory" }, { status: 500 });
  }
}
