import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findFirearms: vi.fn(),
  findAccessories: vi.fn(),
  findDocuments: vi.fn(),
  findAmmoStocks: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSettings: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    firearm: {
      findMany: mocks.findFirearms,
    },
    accessory: {
      findMany: mocks.findAccessories,
    },
    ammoStock: {
      findMany: mocks.findAmmoStocks,
    },
    document: {
      findMany: mocks.findDocuments,
    },
  },
}));

import { GET } from "./route";

describe("GET /api/exports/full-armory", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.findFirearms.mockResolvedValue([
      {
        id: "firearm-1",
        name: "Duty Carbine",
        manufacturer: "Acme",
        model: "M4",
        caliber: "5.56",
        serialNumber: "ABC123456",
        type: "RIFLE",
        acquisitionDate: new Date("2025-01-15T00:00:00.000Z"),
        purchasePrice: 1200,
        currentValue: 1450,
        notes: "Primary",
        imageUrl: "/api/files/images/firearms/firearm-1.jpg",
      },
    ]);

    mocks.findAccessories.mockResolvedValue([
      {
        id: "accessory-1",
        name: "Red Dot",
        manufacturer: "DotCo",
        model: "RDS-1",
        type: "OPTIC",
        caliber: null,
        acquisitionDate: null,
        purchasePrice: 200,
        notes: null,
        imageUrl: null,
      },
    ]);

    mocks.findDocuments.mockResolvedValue([
      {
        id: "doc-1",
        type: "RECEIPT",
        name: "Firearm Receipt",
        firearmId: "firearm-1",
        accessoryId: null,
        firearm: { id: "firearm-1", name: "Duty Carbine" },
        accessory: null,
        mimeType: "image/jpeg",
        fileSize: 5120,
        fileUrl: "/api/files/documents/receipt-1.jpg",
        createdAt: new Date("2025-02-01T10:00:00.000Z"),
      },
      {
        id: "doc-2",
        type: "RECEIPT",
        name: "Accessory Receipt PDF",
        firearmId: null,
        accessoryId: "accessory-1",
        firearm: null,
        accessory: { id: "accessory-1", name: "Red Dot" },
        mimeType: "application/pdf",
        fileSize: 4096,
        fileUrl: "/api/files/documents/receipt-2.pdf",
        createdAt: new Date("2025-02-03T10:00:00.000Z"),
      },
    ]);

    mocks.findAmmoStocks.mockResolvedValue([
      { id: "ammo-1", caliber: "5.56", quantity: 300 },
      { id: "ammo-2", caliber: "5.56", quantity: 200 },
      { id: "ammo-3", caliber: "9mm", quantity: 120 },
    ]);
  });

  it("keeps claims semantics and includes image/doc rows", async () => {
    const request = new NextRequest("http://localhost/api/exports/full-armory?preset=CLAIMS");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.meta.preset).toBe("CLAIMS");
    expect(json.items[0].serialNumber).toBe("ABC123456");
    expect(json.items[0].imageUrl).toBe("/api/files/images/firearms/firearm-1.jpg");
    expect(json.summary.totalItems).toBe(2);
    expect(json.summary.totalReceipts).toBe(2);
    expect(json.csv.inventoryItems).toContain("imageUrl");
    expect(json.csv.attachmentsIndex).toContain("Accessory Receipt PDF");
    expect(json.ammoSummary).toEqual([
      { caliber: "5.56", totalRounds: 500, stockEntries: 2 },
      { caliber: "9mm", totalRounds: 120, stockEntries: 1 },
    ]);
  });

  it("parses include options and creates backup file references", async () => {
    const request = new NextRequest(
      "http://localhost/api/exports/full-armory?preset=BACKUP&includeSerialNumbers=false&includeDocuments=false&includeImages=false&includeAmmo=false&includeValue=false&imageMode=ALL_IMAGES"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.meta.preset).toBe("BACKUP");
    expect(json.meta.exportOptions).toEqual({
      preset: "BACKUP",
      includeSerialNumbers: false,
      includeAmmo: false,
      includeValue: false,
      includeImages: false,
      includeDocuments: false,
      includePhotos: false,
      includeReceipts: false,
      imageMode: "ALL_IMAGES",
    });
    expect(json.items[0].serialNumber).toBe("");
    expect(json.items[0].purchasePrice).toBeNull();
    expect(json.items[0].imageUrl).toBe("");
    expect(json.attachments).toEqual([]);
    expect(json.ammoSummary).toEqual([]);
    expect(json.backupFiles).toEqual([]);
  });

  it("includes backup manifest rows for safe file URLs", async () => {
    const request = new NextRequest("http://localhost/api/exports/full-armory?preset=BACKUP");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.backupFiles.length).toBe(3);
    expect(json.backupFiles[0].storagePath).toContain("storage/uploads/documents/");
    expect(json.backupFiles.some((row: { category: string; storagePath: string }) => row.category === "IMAGE" && row.storagePath.includes("storage/uploads/images/firearms"))).toBe(true);
  });
});
