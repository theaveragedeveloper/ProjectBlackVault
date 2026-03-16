import { describe, expect, it } from "vitest";
import {
  selectVisualEvidence,
  type FullArmoryExportOptions,
  type FullArmoryExportResponse,
} from "@/lib/exports/full-armory";

function createPayload(): FullArmoryExportResponse {
  return {
    meta: {
      generatedAt: "2026-03-16T12:00:00.000Z",
      preset: "CLAIMS",
      includesAllUploadedReceipts: true,
      exportOptions: {
        preset: "CLAIMS",
        includePhotos: true,
        includeReceipts: true,
        imageMode: "PRIMARY_ONLY",
      },
    },
    summary: {
      totalItems: 2,
      totalFirearms: 1,
      totalAccessories: 1,
      totalDocuments: 4,
      totalReceipts: 4,
      totalPurchaseValue: 1400,
      totalReplacementValue: 1600,
      missingEvidence: {
        missingReceipts: 0,
        missingPhotos: 0,
        missingValues: 0,
        missingSerials: 1,
      },
    },
    items: [
      {
        itemId: "item-1",
        entityType: "FIREARM",
        category: "RIFLE",
        manufacturer: "Acme",
        model: "M4",
        caliber: "5.56",
        serialNumber: "ABC123",
        hasSerial: true,
        purchaseDate: "2025-01-01",
        purchasePrice: 1200,
        replacementValue: 1400,
        receiptCount: 2,
        documentCount: 2,
        hasPhoto: true,
        imageUrl: "/api/files/documents/item-1.jpg",
        missingSerial: false,
        missingReceipt: false,
        missingPhoto: false,
        missingValue: false,
        notes: "",
      },
      {
        itemId: "item-2",
        entityType: "ACCESSORY",
        category: "OPTIC",
        manufacturer: "DotCo",
        model: "RDS",
        caliber: "",
        serialNumber: "",
        hasSerial: false,
        purchaseDate: "",
        purchasePrice: 200,
        replacementValue: null,
        receiptCount: 2,
        documentCount: 2,
        hasPhoto: true,
        imageUrl: "/api/files/documents/item-2.jpg",
        missingSerial: true,
        missingReceipt: false,
        missingPhoto: false,
        missingValue: false,
        notes: "",
      },
    ],
    attachments: [
      {
        documentId: "doc-image-1",
        type: "RECEIPT",
        name: "Receipt 1",
        linkedItemId: "item-1",
        linkedItemType: "FIREARM",
        linkedItemName: "M4",
        mimeType: "image/jpeg",
        fileSize: 1000,
        fileUrl: "/api/files/documents/r1.jpg",
        uploadedAt: "2026-02-01T00:00:00.000Z",
      },
      {
        documentId: "doc-image-2",
        type: "RECEIPT",
        name: "Receipt 2",
        linkedItemId: "item-1",
        linkedItemType: "FIREARM",
        linkedItemName: "M4",
        mimeType: "image/png",
        fileSize: 1000,
        fileUrl: "/api/files/documents/r2.png",
        uploadedAt: "2026-02-02T00:00:00.000Z",
      },
      {
        documentId: "doc-pdf-1",
        type: "RECEIPT",
        name: "Receipt PDF",
        linkedItemId: "item-2",
        linkedItemType: "ACCESSORY",
        linkedItemName: "RDS",
        mimeType: "application/pdf",
        fileSize: 2000,
        fileUrl: "/api/files/documents/r3.pdf",
        uploadedAt: "2026-02-03T00:00:00.000Z",
      },
      {
        documentId: "doc-image-3",
        type: "RECEIPT",
        name: "Unattached Receipt",
        linkedItemId: "",
        linkedItemType: "UNATTACHED",
        linkedItemName: "",
        mimeType: "image/webp",
        fileSize: 1000,
        fileUrl: "/api/files/documents/r4.webp",
        uploadedAt: "2026-02-04T00:00:00.000Z",
      },
    ],
    csv: {
      inventoryItems: "header",
      attachmentsIndex: "header",
      valuationSummary: "header",
    },
  };
}

describe("full armory visual evidence selection", () => {
  it("selects primary-only evidence and excludes PDF receipts", () => {
    const payload = createPayload();
    const options: FullArmoryExportOptions = {
      preset: "CLAIMS",
      includePhotos: true,
      includeReceipts: true,
      imageMode: "PRIMARY_ONLY",
    };

    const result = selectVisualEvidence(payload, options);

    expect(result.map((row) => row.id)).toContain("item:item-1");
    expect(result.map((row) => row.id)).toContain("item:item-2");
    expect(result.map((row) => row.id)).toContain("receipt:doc-image-1");
    expect(result.map((row) => row.id)).toContain("receipt:doc-image-3");
    expect(result.map((row) => row.id)).not.toContain("receipt:doc-image-2");
    expect(result.map((row) => row.id)).not.toContain("receipt:doc-pdf-1");
  });

  it("selects all eligible receipt images in ALL_IMAGES mode", () => {
    const payload = createPayload();
    const options: FullArmoryExportOptions = {
      preset: "CLAIMS",
      includePhotos: false,
      includeReceipts: true,
      imageMode: "ALL_IMAGES",
    };

    const result = selectVisualEvidence(payload, options);

    expect(result.map((row) => row.id)).toContain("receipt:doc-image-1");
    expect(result.map((row) => row.id)).toContain("receipt:doc-image-2");
    expect(result.map((row) => row.id)).toContain("receipt:doc-image-3");
    expect(result.map((row) => row.id)).not.toContain("receipt:doc-pdf-1");
  });
});
