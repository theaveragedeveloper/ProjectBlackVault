import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  enforceRateLimit: vi.fn(),
  getClientIp: vi.fn(),
  upsertSettings: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));

vi.mock("@/lib/server/client-ip", () => ({
  getClientIp: mocks.getClientIp,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSettings: {
      upsert: mocks.upsertSettings,
    },
  },
}));

vi.mock("@/lib/password", () => ({
  hashPassword: () => "hashed-value",
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: mocks.setCookie,
  }),
}));

import { POST } from "./route";

const ORIGINAL_ENV = process.env;

describe("POST /api/auth/recover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, PASSWORD_RECOVERY_SECRET: "recover-secret" };
    mocks.getClientIp.mockReturnValue("127.0.0.1");
    mocks.enforceRateLimit.mockResolvedValue({ allowed: true });
    mocks.upsertSettings.mockResolvedValue({ id: "singleton" });
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("resets password when recovery secret matches", async () => {
    const request = new NextRequest("http://localhost/api/auth/recover", {
      method: "POST",
      body: JSON.stringify({ recoverySecret: "recover-secret", newPassword: "new-pass-123" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mocks.upsertSettings).toHaveBeenCalledTimes(1);
    expect(mocks.setCookie).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid recovery secret", async () => {
    const request = new NextRequest("http://localhost/api/auth/recover", {
      method: "POST",
      body: JSON.stringify({ recoverySecret: "wrong", newPassword: "new-pass-123" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Invalid recovery credentials");
    expect(mocks.upsertSettings).not.toHaveBeenCalled();
  });

  it("returns 503 when recovery is not configured", async () => {
    delete process.env.PASSWORD_RECOVERY_SECRET;
    delete process.env.ALLOW_SESSION_SECRET_PASSWORD_RESET;

    const request = new NextRequest("http://localhost/api/auth/recover", {
      method: "POST",
      body: JSON.stringify({ recoverySecret: "recover-secret", newPassword: "new-pass-123" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toBe("Password recovery is not configured");
    expect(mocks.upsertSettings).not.toHaveBeenCalled();
  });
});
