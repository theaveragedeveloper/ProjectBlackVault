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
  "format=csv&firearms=true&accessories=true&builds=false&ammo=false&rangeSessions=false&documents=true&settings=false";

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

  it("includes upload references and storage guidance in CSV when enabled", async () => {
    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: true,
    });

    const response = await GET(new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY}`));
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(csv).toContain("includeUploadReferences");
    expect(csv).toContain("true");
    expect(csv).toContain("uploadedAssetReferences");
    expect(csv).toContain("backupStorageGuidance");
    expect(csv).toMatch(/storage\/uploads/i);
    expect(csv).toMatch(/\/app\/storage/i);
  });

  it("omits upload references and guidance in CSV when disabled", async () => {
    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: false,
    });

    const response = await GET(new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY}`));
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(csv).toContain("includeUploadReferences");
    expect(csv).toContain("false");
    expect(csv).not.toContain("uploadedAssetReferences");
    expect(csv).not.toContain("backupStorageGuidance");
  });

  it("writes uploaded reference sections to CSV only when enabled", async () => {
    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: true,
    });

    const enabledCsv = await GET(
      new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY}`)
    );

    const enabledText = await enabledCsv.text();
    expect(enabledText).toContain("uploadedAssetReferences");
    expect(enabledText).toContain("backupStorageGuidance");

    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: false,
    });

    const disabledCsv = await GET(
      new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY}`)
    );

    const disabledText = await disabledCsv.text();
    expect(disabledText).not.toContain("uploadedAssetReferences");
    expect(disabledText).not.toContain("backupStorageGuidance");
  });

  it("rejects unsupported formats", async () => {
    mocks.appSettingsFindUnique.mockResolvedValue({
      id: "singleton",
      includeUploadsInBackup: true,
    });

    const response = await GET(
      new NextRequest(`http://localhost/api/exports/data?${BASE_QUERY.replace("format=csv", "format=json")}`)
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toMatch(/Supported values: csv, pdf/);
  });
});
