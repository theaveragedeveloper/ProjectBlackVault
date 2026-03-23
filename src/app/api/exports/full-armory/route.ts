import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  type ExportPreset,
  parseExportOptionsFromSearchParams,
} from "@/lib/exports/full-armory";
import { getCanonicalUploadsRoot, resolveDocumentStoragePath } from "@/lib/upload-security";
import { requireAuth } from "@/lib/server/auth";

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

function toSafeBasename(fileUrl: string): string | null {
  const value = fileUrl.trim();
  const prefix = "/api/files/images/";
  if (!value.startsWith(prefix)) return null;

  const rest = value.slice(prefix.length);
  const segments = rest.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  if (!segments.every((seg) => /^[a-zA-Z0-9._-]+$/.test(seg))) return null;

  return path.join("images", ...segments);
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const exportOptions = parseExportOptionsFromSearchParams(request.nextUrl.searchParams);
    const preset: ExportPreset = exportOptions.preset;

    const [firearms, accessories, documents, ammoStocks] = await Promise.all([
      prisma.firearm.findMany({ orderBy: [{ manufacturer: "asc" }, { model: "asc" }, { name: "asc" }] }),
      prisma.accessory.findMany({ orderBy: [{ manufacturer: "asc" }, { name: "asc" }] }),
      exportOptions.includeDocuments
        ? (prisma as any).document.findMany({
            orderBy: [{ createdAt: "asc" }],
            include: {
              firearm: { select: { id: true, name: true } },
              accessory: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
      exportOptions.includeAmmo
        ? prisma.ammoStock.findMany({
            orderBy: [{ caliber: "asc" }, { brand: "asc" }],
          })
        : Promise.resolve([]),
    ]) as [any[], any[], any[], any[]];

    const receiptDocuments = documents.filter((doc: any) => doc.type === "RECEIPT");

    const itemRows = [
      ...firearms.map((firearm: any) => {
        const itemDocs = documents.filter((doc: any) => doc.firearmId === firearm.id);
        const receiptCount = itemDocs.filter((doc: any) => doc.type === "RECEIPT").length;
        const hasPhoto = exportOptions.includeImages ? !!firearm.imageUrl : false;
        const serialValue = !exportOptions.includeSerialNumbers
          ? ""
          : preset === "BACKUP"
          ? maskSerial(firearm.serialNumber)
          : (firearm.serialNumber ?? "");

        return {
          itemId: firearm.id,
          entityType: "FIREARM",
          category: firearm.type || "",
          manufacturer: firearm.manufacturer || "",
          model: firearm.model || firearm.name,
          caliber: firearm.caliber || "",
          serialNumber: serialValue,
          hasSerial: !!firearm.serialNumber,
          purchaseDate: formatDate(firearm.acquisitionDate),
          purchasePrice: exportOptions.includeValue ? firearm.purchasePrice ?? null : null,
          replacementValue: exportOptions.includeValue ? firearm.currentValue ?? null : null,
          receiptCount: exportOptions.includeDocuments ? receiptCount : 0,
          documentCount: exportOptions.includeDocuments ? itemDocs.length : 0,
          hasPhoto,
          imageUrl: exportOptions.includeImages ? firearm.imageUrl ?? "" : "",
          missingSerial: exportOptions.includeSerialNumbers ? !firearm.serialNumber : false,
          missingReceipt: exportOptions.includeDocuments ? receiptCount === 0 : false,
          missingPhoto: exportOptions.includeImages ? !hasPhoto : false,
          missingValue: exportOptions.includeValue ? firearm.currentValue == null && firearm.purchasePrice == null : false,
          notes: firearm.notes ?? "",
        };
      }),
      ...accessories.map((accessory: any) => {
        const itemDocs = documents.filter((doc: any) => doc.accessoryId === accessory.id);
        const receiptCount = itemDocs.filter((doc: any) => doc.type === "RECEIPT").length;
        const hasPhoto = exportOptions.includeImages ? !!accessory.imageUrl : false;

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
          purchasePrice: exportOptions.includeValue ? accessory.purchasePrice ?? null : null,
          replacementValue: null,
          receiptCount: exportOptions.includeDocuments ? receiptCount : 0,
          documentCount: exportOptions.includeDocuments ? itemDocs.length : 0,
          hasPhoto,
          imageUrl: exportOptions.includeImages ? accessory.imageUrl ?? "" : "",
          missingSerial: false,
          missingReceipt: exportOptions.includeDocuments ? receiptCount === 0 : false,
          missingPhoto: exportOptions.includeImages ? !hasPhoto : false,
          missingValue: exportOptions.includeValue ? accessory.purchasePrice == null : false,
          notes: accessory.notes ?? "",
        };
      }),
    ];

    const attachmentsRows = exportOptions.includeDocuments
      ? documents.map((doc: any) => ({
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
        }))
      : [];

    const ammoByCaliber = new Map<string, { totalRounds: number; stockEntries: number }>();
    for (const stock of ammoStocks) {
      const caliber = stock.caliber || "Unknown";
      const entry = ammoByCaliber.get(caliber) ?? { totalRounds: 0, stockEntries: 0 };
      entry.totalRounds += Number(stock.quantity ?? 0);
      entry.stockEntries += 1;
      ammoByCaliber.set(caliber, entry);
    }

    const ammoSummary = Array.from(ammoByCaliber.entries()).map(([caliber, value]) => ({
      caliber,
      totalRounds: value.totalRounds,
      stockEntries: value.stockEntries,
    }));

    const uploadsRoot = getCanonicalUploadsRoot();
    const backupFiles = preset === "BACKUP"
      ? [
          ...attachmentsRows.map((row) => {
            const resolved = resolveDocumentStoragePath(row.fileUrl);
            if (!resolved) return null;
            return {
              category: "DOCUMENT",
              fileUrl: row.fileUrl,
              storagePath: resolved,
              fileName: path.basename(resolved),
              linkedItemId: row.linkedItemId,
              linkedItemType: row.linkedItemType,
              linkedItemName: row.linkedItemName,
            };
          }),
          ...itemRows.map((item) => {
            if (!item.imageUrl) return null;
            const relativeImagePath = toSafeBasename(item.imageUrl);
            if (!relativeImagePath) return null;
            const resolved = path.resolve(uploadsRoot, relativeImagePath);
            return {
              category: "IMAGE",
              fileUrl: item.imageUrl,
              storagePath: resolved,
              fileName: path.basename(resolved),
              linkedItemId: item.itemId,
              linkedItemType: item.entityType,
              linkedItemName: `${item.manufacturer} ${item.model}`.trim(),
            };
          }),
        ].filter(Boolean)
      : [];

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
        value: attachmentsRows.length,
      },
      {
        metric: "Total Receipts",
        value: exportOptions.includeDocuments ? receiptDocuments.length : 0,
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
      {
        metric: "Total Ammo Rounds",
        value: ammoSummary.reduce((sum, row) => sum + row.totalRounds, 0),
      },
      {
        metric: "Backup File References",
        value: backupFiles.length,
      },
    ];

    return NextResponse.json({
      meta: {
        generatedAt: new Date().toISOString(),
        preset,
        includesAllUploadedReceipts: exportOptions.includeDocuments,
        exportOptions,
      },
      summary: {
        totalItems: itemRows.length,
        totalFirearms: firearms.length,
        totalAccessories: accessories.length,
        totalDocuments: attachmentsRows.length,
        totalReceipts: exportOptions.includeDocuments ? receiptDocuments.length : 0,
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
      ammoSummary,
      backupFiles,
      csv: {
        inventoryItems: rowsToCsv(itemRows),
        attachmentsIndex: rowsToCsv(attachmentsRows),
        valuationSummary: rowsToCsv(summaryRows),
        ammoSummary: rowsToCsv(ammoSummary),
        backupFiles: rowsToCsv(backupFiles),
      },
    });
  } catch (error) {
    console.error("GET /api/exports/full-armory error:", error);
    return NextResponse.json({ error: "Failed to generate full armory export" }, { status: 500 });
  }
}
