import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  type ExportPreset,
  parseExportOptionsFromSearchParams,
} from "@/lib/exports/full-armory";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return lines.join("\n");
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function maskSerial(serialNumber: string | null | undefined): string {
  if (!serialNumber) return "";
  if (serialNumber.length <= 4) return "****";
  return `${"*".repeat(Math.max(serialNumber.length - 4, 3))}${serialNumber.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const exportOptions = parseExportOptionsFromSearchParams(request.nextUrl.searchParams);
    const preset: ExportPreset = exportOptions.preset;

    const [firearms, accessories, documents] = await Promise.all([
      prisma.firearm.findMany({ orderBy: [{ manufacturer: "asc" }, { model: "asc" }, { name: "asc" }] }),
      prisma.accessory.findMany({ orderBy: [{ manufacturer: "asc" }, { name: "asc" }] }),
      prisma.document.findMany({
        orderBy: [{ createdAt: "asc" }],
        include: {
          firearm: { select: { id: true, name: true } },
          accessory: { select: { id: true, name: true } },
        },
      }),
    ]);

    const receiptDocuments = documents.filter((doc) => doc.type === "RECEIPT");

    const itemRows = [
      ...firearms.map((firearm) => {
        const itemDocs = documents.filter((doc) => doc.firearmId === firearm.id);
        const receiptCount = itemDocs.filter((doc) => doc.type === "RECEIPT").length;
        const hasPhoto = !!firearm.imageUrl;

        return {
          itemId: firearm.id,
          entityType: "FIREARM",
          category: firearm.type || "",
          manufacturer: firearm.manufacturer || "",
          model: firearm.model || firearm.name,
          caliber: firearm.caliber || "",
          serialNumber: preset === "BACKUP" ? maskSerial(firearm.serialNumber) : (firearm.serialNumber ?? ""),
          hasSerial: !!firearm.serialNumber,
          purchaseDate: formatDate(firearm.acquisitionDate),
          purchasePrice: firearm.purchasePrice ?? null,
          replacementValue: firearm.currentValue ?? null,
          receiptCount,
          documentCount: itemDocs.length,
          hasPhoto,
          imageUrl: firearm.imageUrl ?? "",
          missingSerial: !firearm.serialNumber,
          missingReceipt: receiptCount === 0,
          missingPhoto: !hasPhoto,
          missingValue: firearm.currentValue == null && firearm.purchasePrice == null,
          notes: firearm.notes ?? "",
        };
      }),
      ...accessories.map((accessory) => {
        const itemDocs = documents.filter((doc) => doc.accessoryId === accessory.id);
        const receiptCount = itemDocs.filter((doc) => doc.type === "RECEIPT").length;
        const hasPhoto = !!accessory.imageUrl;

        return {
          itemId: accessory.id,
          entityType: "ACCESSORY",
          category: accessory.type || "",
          manufacturer: accessory.manufacturer || "",
          model: accessory.model || accessory.name,
          caliber: accessory.caliber || "",
          serialNumber: "",
          hasSerial: false,
          purchaseDate: formatDate(accessory.acquisitionDate),
          purchasePrice: accessory.purchasePrice ?? null,
          replacementValue: null,
          receiptCount,
          documentCount: itemDocs.length,
          hasPhoto,
          imageUrl: accessory.imageUrl ?? "",
          missingSerial: true,
          missingReceipt: receiptCount === 0,
          missingPhoto: !hasPhoto,
          missingValue: accessory.purchasePrice == null,
          notes: accessory.notes ?? "",
        };
      }),
    ];

    const attachmentsRows = documents.map((doc) => ({
      documentId: doc.id,
      type: doc.type,
      name: doc.name,
      linkedItemId: doc.firearmId || doc.accessoryId || "",
      linkedItemType: doc.firearmId ? "FIREARM" : doc.accessoryId ? "ACCESSORY" : "UNATTACHED",
      linkedItemName: doc.firearm?.name || doc.accessory?.name || "",
      mimeType: doc.mimeType ?? "",
      fileSize: doc.fileSize ?? "",
      fileUrl: doc.fileUrl,
      uploadedAt: doc.createdAt.toISOString(),
    }));

    const totalPurchaseValue = itemRows.reduce((sum, item) => sum + (typeof item.purchasePrice === "number" ? item.purchasePrice : 0), 0);
    const totalReplacementValue = itemRows.reduce((sum, item) => sum + (typeof item.replacementValue === "number" ? item.replacementValue : 0), 0);

    const summaryRows = [
      {
        metric: "Generated At",
        value: new Date().toISOString(),
      },
      {
        metric: "Preset",
        value: preset,
      },
      {
        metric: "Total Items",
        value: itemRows.length,
      },
      {
        metric: "Total Firearms",
        value: firearms.length,
      },
      {
        metric: "Total Accessories",
        value: accessories.length,
      },
      {
        metric: "Total Documents",
        value: documents.length,
      },
      {
        metric: "Total Receipts",
        value: receiptDocuments.length,
      },
      {
        metric: "Total Purchase Value",
        value: totalPurchaseValue.toFixed(2),
      },
      {
        metric: "Total Replacement Value",
        value: totalReplacementValue.toFixed(2),
      },
      {
        metric: "Items Missing Receipts",
        value: itemRows.filter((i) => i.missingReceipt).length,
      },
      {
        metric: "Items Missing Photos",
        value: itemRows.filter((i) => i.missingPhoto).length,
      },
      {
        metric: "Items Missing Value",
        value: itemRows.filter((i) => i.missingValue).length,
      },
      {
        metric: "Items Missing Serial",
        value: itemRows.filter((i) => i.missingSerial).length,
      },
    ];

    return NextResponse.json({
      meta: {
        generatedAt: new Date().toISOString(),
        preset,
        includesAllUploadedReceipts: true,
        exportOptions,
      },
      summary: {
        totalItems: itemRows.length,
        totalFirearms: firearms.length,
        totalAccessories: accessories.length,
        totalDocuments: documents.length,
        totalReceipts: receiptDocuments.length,
        totalPurchaseValue,
        totalReplacementValue,
        missingEvidence: {
          missingReceipts: itemRows.filter((i) => i.missingReceipt).length,
          missingPhotos: itemRows.filter((i) => i.missingPhoto).length,
          missingValues: itemRows.filter((i) => i.missingValue).length,
          missingSerials: itemRows.filter((i) => i.missingSerial).length,
        },
      },
      items: itemRows,
      attachments: attachmentsRows,
      csv: {
        inventoryItems: rowsToCsv(itemRows),
        attachmentsIndex: rowsToCsv(attachmentsRows),
        valuationSummary: rowsToCsv(summaryRows),
      },
    });
  } catch (error) {
    console.error("GET /api/exports/full-armory error:", error);
    return NextResponse.json({ error: "Failed to generate full armory export" }, { status: 500 });
  }
}
