/**
 * Regression tests for partial update semantics in PUT /api/range-sessions/[id].
 *
 * Verifies that:
 *   1. Omitted optional fields are NOT sent to Prisma (i.e. they remain undefined),
 *      so existing stored values are preserved.
 *   2. Explicitly provided null / empty-string values DO clear the field (set to null).
 *   3. Provided values update correctly without side-effects on other fields.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mock helpers – must be created before vi.mock factory runs
// ---------------------------------------------------------------------------
const {
  mockUpdate,
  mockTransaction,
  mockFindUnique,
  mockDeleteMany,
  mockCreateMany,
  mockAmmoDeleteMany,
  mockAmmoCreate,
} = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockTransaction: vi.fn(),
  mockFindUnique: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockCreateMany: vi.fn(),
  mockAmmoDeleteMany: vi.fn(),
  mockAmmoCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mockTransaction,
    rangeSession: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock("@/lib/server/dashboard", () => ({
  revalidateDashboardCaches: vi.fn(),
}));

// Import handler AFTER mocks are registered
import { PUT } from "@/app/api/range-sessions/[id]/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a NextRequest with a JSON body. */
function makePutRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/range-sessions/test-id", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

/** Params object required by the App Router handler signature. */
const params = { params: Promise.resolve({ id: "test-id" }) };

/** A minimal hydrated session returned by the findUnique after update. */
const hydratedSession = {
  id: "test-id",
  sessionFirearms: [],
  sessionDrills: [],
  ammoLinks: [],
};

/** Mock tx object passed to the $transaction callback. */
function makeMockTx() {
  return {
    rangeSession: { update: mockUpdate },
    sessionFirearm: { deleteMany: mockDeleteMany, createMany: mockCreateMany },
    sessionAmmoLink: { deleteMany: mockAmmoDeleteMany, create: mockAmmoCreate },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: transaction invokes its callback with a mock tx
  mockTransaction.mockImplementation(async (cb: (tx: ReturnType<typeof makeMockTx>) => unknown) =>
    cb(makeMockTx())
  );
  mockUpdate.mockResolvedValue({ id: "test-id" });
  mockFindUnique.mockResolvedValue(hydratedSession);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PUT /api/range-sessions/[id] – partial update semantics", () => {
  it("omitting optional fields passes undefined to Prisma (fields are not overwritten)", async () => {
    // Only send 'date'; all other optional fields are omitted.
    const request = makePutRequest({
      date: "2025-01-15T12:00:00.000Z",
      firearms: [{ firearmId: "firearm-1", roundsFired: 50, buildId: null }],
    });

    const response = await PUT(request, params);
    expect(response.status).toBe(200);

    const [updateCall] = mockUpdate.mock.calls as [{ where: unknown; data: Record<string, unknown> }][];
    const { data } = updateCall[0];

    // Fields absent from the request body must be undefined so Prisma skips them
    expect(data.rangeName).toBeUndefined();
    expect(data.rangeLocation).toBeUndefined();
    expect(data.notes).toBeUndefined();
    expect(data.environment).toBeUndefined();
    expect(data.temperatureF).toBeUndefined();
    expect(data.windSpeedMph).toBeUndefined();
    expect(data.windDirection).toBeUndefined();
    expect(data.humidity).toBeUndefined();
    expect(data.lightCondition).toBeUndefined();
    expect(data.weatherNotes).toBeUndefined();
    expect(data.targetDistanceYd).toBeUndefined();
    expect(data.groupSizeIn).toBeUndefined();
    expect(data.groupSizeMoa).toBeUndefined();
    expect(data.numberOfGroups).toBeUndefined();
    expect(data.groupNotes).toBeUndefined();
  });

  it("sending null for an optional field clears it (sets to null in Prisma)", async () => {
    const request = makePutRequest({
      date: "2025-01-15T12:00:00.000Z",
      firearms: [{ firearmId: "firearm-1", roundsFired: 10 }],
      rangeName: null,
      notes: null,
      temperatureF: null,
    });

    const response = await PUT(request, params);
    expect(response.status).toBe(200);

    const [updateCall] = mockUpdate.mock.calls as [{ where: unknown; data: Record<string, unknown> }][];
    const { data } = updateCall[0];

    expect(data.rangeName).toBeNull();
    expect(data.notes).toBeNull();
    expect(data.temperatureF).toBeNull();
  });

  it("sending an empty string for a string field clears it (sets to null in Prisma)", async () => {
    const request = makePutRequest({
      date: "2025-01-15T12:00:00.000Z",
      firearms: [{ firearmId: "firearm-1", roundsFired: 10 }],
      rangeName: "",
      environment: "",
    });

    const response = await PUT(request, params);
    expect(response.status).toBe(200);

    const [updateCall] = mockUpdate.mock.calls as [{ where: unknown; data: Record<string, unknown> }][];
    const { data } = updateCall[0];

    expect(data.rangeName).toBeNull();
    expect(data.environment).toBeNull();
  });

  it("provided values update correctly without affecting omitted fields", async () => {
    const request = makePutRequest({
      date: "2025-06-01T00:00:00.000Z",
      firearms: [{ firearmId: "firearm-2", roundsFired: 100, buildId: "build-1" }],
      rangeName: "Outdoor Range",
      temperatureF: 72.5,
      numberOfGroups: 3,
    });

    const response = await PUT(request, params);
    expect(response.status).toBe(200);

    const [updateCall] = mockUpdate.mock.calls as [{ where: unknown; data: Record<string, unknown> }][];
    const { data } = updateCall[0];

    // Provided values are set correctly
    expect(data.rangeName).toBe("Outdoor Range");
    expect(data.temperatureF).toBe(72.5);
    expect(data.numberOfGroups).toBe(3);

    // Fields that weren't sent must not be touched (undefined)
    expect(data.rangeLocation).toBeUndefined();
    expect(data.notes).toBeUndefined();
    expect(data.windSpeedMph).toBeUndefined();
    expect(data.groupSizeIn).toBeUndefined();
  });
});
