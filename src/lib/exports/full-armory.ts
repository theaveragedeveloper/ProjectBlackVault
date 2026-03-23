export type ExportPreset = "CLAIMS" | "BACKUP";
export type ExportImageMode = "PRIMARY_ONLY" | "ALL_IMAGES";

export interface FullArmoryExportOptions {
  preset: ExportPreset;
  includeSerialNumbers: boolean;
  includeAmmo: boolean;
  includeValue: boolean;
  includeImages: boolean;
  includeDocuments: boolean;
  includePhotos: boolean;
  includeReceipts: boolean;
  imageMode: ExportImageMode;
}

export interface FullArmoryItemRow {
  itemId: string;
  entityType: "FIREARM" | "ACCESSORY";
  category: string;
  manufacturer: string;
  model: string;
  caliber: string;
  serialNumber: string;
  hasSerial: boolean;
  purchaseDate: string;
  purchasePrice: number | null;
  replacementValue: number | null;
  receiptCount: number;
  documentCount: number;
  hasPhoto: boolean;
  imageUrl: string;
  missingSerial: boolean;
  missingReceipt: boolean;
  missingPhoto: boolean;
  missingValue: boolean;
  notes: string;
}

export interface FullArmoryAttachmentRow {
  documentId: string;
  type: string;
  name: string;
  linkedItemId: string;
  linkedItemType: "FIREARM" | "ACCESSORY" | "UNATTACHED";
  linkedItemName: string;
  mimeType: string;
  fileSize: number | string;
  fileUrl: string;
  uploadedAt: string;
}

export interface FullArmoryBackupFileRow {
  category: "DOCUMENT" | "IMAGE";
  fileUrl: string;
  storagePath: string;
  fileName: string;
  linkedItemId: string;
  linkedItemType: "FIREARM" | "ACCESSORY" | "UNATTACHED";
  linkedItemName: string;
}

export interface FullArmoryAmmoSummaryRow {
  caliber: string;
  totalRounds: number;
  stockEntries: number;
}

export interface FullArmoryExportResponse {
  meta: {
    generatedAt: string;
    preset: ExportPreset;
    includesAllUploadedReceipts: boolean;
    exportOptions: FullArmoryExportOptions;
  };
  summary: {
    totalItems: number;
    totalFirearms: number;
    totalAccessories: number;
    totalDocuments: number;
    totalReceipts: number;
    totalPurchaseValue: number;
    totalReplacementValue: number;
    missingEvidence: {
      missingReceipts: number;
      missingPhotos: number;
      missingValues: number;
      missingSerials: number;
    };
  };
  items: FullArmoryItemRow[];
  attachments: FullArmoryAttachmentRow[];
  ammoSummary: FullArmoryAmmoSummaryRow[];
  backupFiles: FullArmoryBackupFileRow[];
  csv: {
    inventoryItems: string;
    attachmentsIndex: string;
    valuationSummary: string;
    ammoSummary: string;
    backupFiles: string;
  };
}

export interface VisualEvidenceImage {
  id: string;
  source: "ITEM_PHOTO" | "RECEIPT_IMAGE";
  title: string;
  imageUrl: string;
  linkedItemId: string;
  linkedItemName: string;
  uploadedAt?: string;
}

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

function parseBool(raw: string | null, fallback: boolean): boolean {
  if (raw == null) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
}

export function parseExportOptionsFromSearchParams(searchParams: URLSearchParams): FullArmoryExportOptions {
  const presetRaw = searchParams.get("preset");
  const imageModeRaw = searchParams.get("imageMode");

  const includeImages = parseBool(searchParams.get("includeImages"), true);
  const includeDocuments = parseBool(searchParams.get("includeDocuments"), true);

  const includePhotos = parseBool(searchParams.get("includePhotos"), includeImages) && includeImages;
  const includeReceipts = parseBool(searchParams.get("includeReceipts"), includeDocuments) && includeDocuments;

  return {
    preset: presetRaw === "BACKUP" ? "BACKUP" : "CLAIMS",
    includeSerialNumbers: parseBool(searchParams.get("includeSerialNumbers"), true),
    includeAmmo: parseBool(searchParams.get("includeAmmo"), true),
    includeValue: parseBool(searchParams.get("includeValue"), true),
    includeImages,
    includeDocuments,
    includePhotos,
    includeReceipts,
    imageMode: imageModeRaw === "ALL_IMAGES" ? "ALL_IMAGES" : "PRIMARY_ONLY",
  };
}

export function buildExportQueryString(options: FullArmoryExportOptions): string {
  const query = new URLSearchParams();
  query.set("preset", options.preset);
  query.set("includeSerialNumbers", String(options.includeSerialNumbers));
  query.set("includeAmmo", String(options.includeAmmo));
  query.set("includeValue", String(options.includeValue));
  query.set("includeImages", String(options.includeImages));
  query.set("includeDocuments", String(options.includeDocuments));
  query.set("includePhotos", String(options.includePhotos));
  query.set("includeReceipts", String(options.includeReceipts));
  query.set("imageMode", options.imageMode);
  return query.toString();
}

function isImageAttachment(row: FullArmoryAttachmentRow): boolean {
  const mime = (row.mimeType ?? "").toLowerCase();
  if (mime.startsWith("image/")) return true;

  const url = (row.fileUrl ?? "").toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => url.endsWith(ext));
}

export function selectVisualEvidence(
  payload: Pick<FullArmoryExportResponse, "items" | "attachments">,
  options: FullArmoryExportOptions
): VisualEvidenceImage[] {
  const images: VisualEvidenceImage[] = [];

  if (!options.includeImages) {
    return images;
  }

  if (options.includePhotos) {
    for (const item of payload.items) {
      if (!item.imageUrl) continue;
      images.push({
        id: `item:${item.itemId}`,
        source: "ITEM_PHOTO",
        title: `${item.entityType}: ${item.manufacturer} ${item.model}`.trim(),
        imageUrl: item.imageUrl,
        linkedItemId: item.itemId,
        linkedItemName: item.model || item.manufacturer || item.itemId,
      });
    }
  }

  if (options.includeReceipts) {
    for (const row of payload.attachments) {
      if (row.type !== "RECEIPT") continue;
      if (!row.fileUrl || !isImageAttachment(row)) continue;

      images.push({
        id: `receipt:${row.documentId}`,
        source: "RECEIPT_IMAGE",
        title: `Receipt: ${row.name}`,
        imageUrl: row.fileUrl,
        linkedItemId: row.linkedItemId || "UNATTACHED",
        linkedItemName: row.linkedItemName || "Unattached",
        uploadedAt: row.uploadedAt,
      });
    }
  }

  if (options.imageMode === "ALL_IMAGES") {
    return images;
  }

  const deduped: VisualEvidenceImage[] = [];
  const seen = new Set<string>();
  for (const image of images) {
    const key = `${image.source}:${image.linkedItemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(image);
  }
  return deduped;
}
