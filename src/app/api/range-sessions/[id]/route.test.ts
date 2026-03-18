import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  const tx = {
    rangeSession: {
      update: vi.fn(),
    },
    sessionFirearm: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    sessionAmmoLink: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(),
    appSettings: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    rangeSession: {
      findUnique: vi.fn(),
    },
  };

  return { tx, prisma, revalidateDashboardCaches: vi.fn() };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/server/dashboard", () => ({
  revalidateDashboardCaches: mocks.revalidateDashboardCaches,
}));

import { PUT } from "./route";

describe("PUT /api/range-sessions/[id] date parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.tx.rangeSession.update.mockResolvedValue({ id: "session-1" });
    mocks.tx.sessionFirearm.deleteMany.mockResolvedValue({ count: 0 });
    mocks.tx.sessionFirearm.createMany.mockResolvedValue({ count: 0 });
    mocks.tx.sessionAmmoLink.deleteMany.mockResolvedValue({ count: 0 });
    mocks.tx.sessionAmmoLink.create.mockResolvedValue({});

    mocks.prisma.$transaction.mockImplementation(async (cb: (tx: typeof mocks.tx) => unknown) => cb(mocks.tx));
    mocks.prisma.rangeSession.findUnique.mockResolvedValue({ id: "session-1", date: "2026-01-01T00:00:00.000Z" });
  });

  it("accepts a valid date string and stores a Date", async () => {
    const request = new NextRequest("http://localhost/api/range-sessions/session-1", {
      method: "PUT",
      body: JSON.stringify({ date: "2026-01-01" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "session-1" }) });

    expect(response.status).toBe(200);
    expect(mocks.tx.rangeSession.update).toHaveBeenCalledTimes(1);
    const updateArg = mocks.tx.rangeSession.update.mock.calls[0][0];
    expect(updateArg.data.date).toBeInstanceOf(Date);
    expect(updateArg.data.date.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("does not mutate date when date field is omitted", async () => {
    const request = new NextRequest("http://localhost/api/range-sessions/session-1", {
      method: "PUT",
      body: JSON.stringify({ notes: "updated" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "session-1" }) });

    expect(response.status).toBe(200);
    const updateArg = mocks.tx.rangeSession.update.mock.calls[0][0];
    expect(updateArg.data.date).toBeUndefined();
  });

  it("returns 400 for an invalid date string", async () => {
    const request = new NextRequest("http://localhost/api/range-sessions/session-1", {
      method: "PUT",
      body: JSON.stringify({ date: "not-a-date" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "session-1" }) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid date value" });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.tx.rangeSession.update).not.toHaveBeenCalled();
  });
});
