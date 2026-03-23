import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  appSettingsFindUnique: vi.fn(),
  firearmFindMany: vi.fn(),
  accessoryFindMany: vi.fn(),
  documentFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSettings: {
      findUnique: mocks.appSettingsFindUnique,
    },
    firearm: {
      findMany: mocks.firearmFindMany,
    },
    accessory: {
      findMany: mocks.accessoryFindMany,
    },
    document: {
      findMany: mocks.documentFindMany,
    },
  },
}));

import { GET } from "./route";

const BASE_QUERY =
  "format=json&firearms=true&accessories=true&builds=false&ammo=false&rangeSessions=false&documents=true&settings=false";

describe("/api/exports/data backup metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.firearmFindMany.mockResolvedValue([
      {
        id: "f1",
        name: "Duty Rifle",
        imageUrl: "/api/files/images/firearms/f1_1.webp",
        serialNumber: "SER123",
      },
    ]);

    mocks.accessoryFindMany.mockResolvedValue([
      {
        id: "a1",
        name: "Optic",
        imageUrl: "/api/files/images/accessory/a1_1.webp",
      },
    ]);

    mocks.documentFindMany.mockResolvedValue([
      {
        id: "d1",
        name: "Receipt",
        fileUrl: "/api/files/documents/d1.pdf",
      },
    ]);
  });

  it("includes upload references and storage guidance when enabled", async () => {
    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: true,
    });

    const response = await GET(new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY}`));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.meta.includeUploadReferences).toBe(true);
    expect(Array.isArray(json.uploadedAssetReferences)).toBe(true);
    expect(json.uploadedAssetReferences.length).toBe(3);
    expect(json.backupStorageGuidance.summary).toMatch(/storage\/uploads/i);
    expect(json.backupStorageGuidance.volumeHint).toMatch(/\/app\/storage/i);
  });

  it("omits upload references and guidance when disabled", async () => {
    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: false,
    });

    const response = await GET(new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY}`));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.meta.includeUploadReferences).toBe(false);
    expect(json.uploadedAssetReferences).toBeUndefined();
    expect(json.backupStorageGuidance).toBeUndefined();
  });

  it("writes uploaded reference sections to CSV only when enabled", async () => {
    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: true,
    });

    const enabledCsv = await GET(
      new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY.replace("format=json", "format=csv")}`)
    );

    const enabledText = await enabledCsv.text();
    expect(enabledText).toContain("uploadedAssetReferences");
    expect(enabledText).toContain("backupStorageGuidance");

    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: false,
    });

    const disabledCsv = await GET(
      new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY.replace("format=json", "format=csv")}`)
    );

    const disabledText = await disabledCsv.text();
    expect(disabledText).not.toContain("uploadedAssetReferences");
    expect(disabledText).not.toContain("backupStorageGuidance");
  });
});
