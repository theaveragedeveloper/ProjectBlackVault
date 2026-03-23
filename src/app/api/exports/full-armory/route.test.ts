import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findFirearms: vi.fn(),
  findAccessories: vi.fn(),
  findDocuments: vi.fn(),
  findAmmoStocks: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue(null),
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
    ]);

    mocks.findAmmoStocks.mockResolvedValue([
      {
        id: "ammo-1",
        brand: "Federal",
        caliber: "5.56",
        quantity: 300,
        lowStockAlert: 100,
        purchasePrice: 120,
        notes: "Training stash",
      },
    ]);

    mocks.findAmmoStocks.mockResolvedValue([
      { id: "ammo-1", caliber: "5.56", quantity: 300 },
      { id: "ammo-2", caliber: "5.56", quantity: 200 },
      { id: "ammo-3", caliber: "9mm", quantity: 120 },
    ]);
  });

  it("returns JSON payload aligned with new include toggles", async () => {
    const request = new NextRequest(
      "http://localhost/api/exports/full-armory?preset=BACKUP&includeSerialNumbers=false&includeAmmo=true&includeValue=false&includeImages=false&includeDocuments=false"
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.meta.exportOptions).toEqual({
      preset: "BACKUP",
      includeSerialNumbers: false,
      includeAmmo: true,
      includeValue: false,
      includeImages: false,
      includeDocuments: false,
    });
    expect(json.items[0].serialNumber).toBe("");
    expect(json.items[0].imageUrl).toBe("");
    expect(json.items[0].purchasePrice).toBeNull();
    expect(json.attachments).toHaveLength(0);
    expect(json.ammo).toHaveLength(3);
  });

  it("returns 400 for unsupported format values", async () => {
    const request = new NextRequest("http://localhost/api/exports/full-armory?format=json");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("Supported values: csv, pdf");
  });

  it("returns downloadable CSV with structured section rows", async () => {
    const request = new NextRequest("http://localhost/api/exports/full-armory?format=csv");
    const response = await GET(request);
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(csv).toContain("section");
    expect(csv).toContain("attachments");
    expect(csv).toContain("/api/files/documents/receipt-1.jpg");
  });

  it("returns PDF bytes for download format", async () => {
    const request = new NextRequest("http://localhost/api/exports/full-armory?format=pdf&includeDocuments=false");
    const response = await GET(request);
    const pdf = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/pdf");
    expect(pdf.startsWith("%PDF-")).toBe(true);
  });

  it("returns non-empty CSV output when there is no export data", async () => {
    mocks.findFirearms.mockResolvedValue([]);
    mocks.findAccessories.mockResolvedValue([]);
    mocks.findDocuments.mockResolvedValue([]);
    mocks.findAmmoStocks.mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/exports/full-armory?format=csv");
    const response = await GET(request);
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(csv.length).toBeGreaterThan(0);
    expect(csv).toContain("summary");
    expect(csv).toContain("generatedAt");
  });
});
