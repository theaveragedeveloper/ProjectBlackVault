import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSettings: {
      findUnique: mocks.findUnique,
      create: mocks.create,
      upsert: mocks.upsert,
    },
  },
}));

import { GET, PUT } from "./route";

describe("/api/settings backup fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns persisted backup settings from GET", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "singleton",
      googleCseApiKey: null,
      enableImageSearch: false,
      includeUploadsInBackup: false,
      autoBackupEnabled: true,
      autoBackupCadence: "monthly",
      defaultCurrency: "USD",
      appPassword: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.includeUploadsInBackup).toBe(false);
    expect(json.autoBackupEnabled).toBe(true);
    expect(json.autoBackupCadence).toBe("monthly");
  });

  it("persists backup settings via PUT", async () => {
    mocks.upsert.mockResolvedValue({
      id: "singleton",
      googleCseApiKey: null,
      enableImageSearch: false,
      includeUploadsInBackup: true,
      autoBackupEnabled: true,
      autoBackupCadence: "weekly",
      defaultCurrency: "USD",
      appPassword: null,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      updatedAt: new Date("2026-03-02T00:00:00.000Z"),
    });

    const request = new NextRequest("http://localhost/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        includeUploadsInBackup: true,
        autoBackupEnabled: true,
        autoBackupCadence: "weekly",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    const upsertArgs = mocks.upsert.mock.calls[0][0];
    expect(upsertArgs.update.includeUploadsInBackup).toBe(true);
    expect(upsertArgs.update.autoBackupEnabled).toBe(true);
    expect(upsertArgs.update.autoBackupCadence).toBe("weekly");
    expect(json.autoBackupCadence).toBe("weekly");
  });

  it("rejects invalid cadence values", async () => {
    const request = new NextRequest("http://localhost/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        autoBackupCadence: "every-hour",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toMatch(/Invalid auto backup cadence/i);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
