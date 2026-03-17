import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findFirearms: vi.fn(),
  findAccessories: vi.fn(),
  findDocuments: vi.fn(),
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
        imageUrl: "/api/files/documents/firearm-photo.jpg",
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
  });

  it("keeps claims semantics and includes image URLs in item rows", async () => {
    const request = new NextRequest("http://localhost/api/exports/full-armory?preset=CLAIMS");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.meta.preset).toBe("CLAIMS");
    expect(json.items[0].serialNumber).toBe("ABC123456");
    expect(json.items[0].imageUrl).toBe("/api/files/documents/firearm-photo.jpg");
    expect(json.summary.totalItems).toBe(2);
    expect(json.summary.totalReceipts).toBe(2);
    expect(json.csv.inventoryItems).toContain("imageUrl");
    expect(json.csv.attachmentsIndex).toContain("Accessory Receipt PDF");
  });

  it("parses export options and masks serials for backup preset", async () => {
    const request = new NextRequest(
      "http://localhost/api/exports/full-armory?preset=BACKUP&includePhotos=false&includeReceipts=0&imageMode=ALL_IMAGES"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.meta.preset).toBe("BACKUP");
    expect(json.meta.exportOptions).toEqual({
      preset: "BACKUP",
      includePhotos: false,
      includeReceipts: false,
      imageMode: "ALL_IMAGES",
    });
    expect(json.items[0].serialNumber).toMatch(/\*+3456$/);
  });
});
