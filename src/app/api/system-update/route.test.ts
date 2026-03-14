import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exec: vi.fn(),
  existsSync: vi.fn(),
  verifyTokenNode: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  exec: mocks.exec,
}));

vi.mock("node:fs", () => ({
  existsSync: mocks.existsSync,
}));

vi.mock("@/lib/session", () => ({
  verifyTokenNode: mocks.verifyTokenNode,
}));

import { POST } from "./route";

const ORIGINAL_ENV = process.env;

function createRequest() {
  return new NextRequest("http://localhost/api/system-update", {
    method: "POST",
    headers: {
      cookie: "vault_session=test-token",
    },
  });
}

function mockExecImplementation(handler: (command: string) => { stdout?: string; stderr?: string } | Error) {
  mocks.exec.mockImplementation((command: string, _options: unknown, callback: (error: Error | null, result: { stdout: string; stderr: string }) => void) => {
    const result = handler(command);

    if (result instanceof Error) {
      callback(result, { stdout: "", stderr: "" });
      return {};
    }

    callback(null, { stdout: result.stdout ?? "", stderr: result.stderr ?? "" });
    return {};
  });
}

describe("POST /api/system-update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      SYSTEM_UPDATE_STATUS_ENABLED: "true",
      SYSTEM_UPDATE_EXEC_ENABLED: "true",
      SESSION_SECRET: "secret",
      NODE_ENV: "test",
    };
    mocks.verifyTokenNode.mockReturnValue(true);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("supports git mode success", async () => {
    process.env.SYSTEM_UPDATE_MODE = "git";
    delete process.env.SYSTEM_UPDATE_COMMAND;

    mocks.existsSync.mockReturnValue(true);

    let revParseCount = 0;
    mockExecImplementation((command) => {
      if (command === "git rev-parse --short HEAD") {
        revParseCount += 1;
        return { stdout: revParseCount === 1 ? "abc123\n" : "def456\n" };
      }
      if (command === "git pull --ff-only") {
        return { stdout: "Already up to date.\n" };
      }
      return new Error(`Unexpected command: ${command}`);
    });

    const response = await POST(createRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.mode).toBe("git");
    expect(json.changed).toBe(true);
  });

  it("returns clear error when git mode is requested but repo is unavailable", async () => {
    process.env.SYSTEM_UPDATE_MODE = "git";

    mocks.existsSync.mockReturnValue(false);
    mockExecImplementation((command) => {
      if (command === "git rev-parse --is-inside-work-tree") {
        return new Error("fatal: not a git repository");
      }
      return new Error(`Unexpected command: ${command}`);
    });

    const response = await POST(createRequest());
    const json = await response.json();

    expect(response.status).toBe(422);
    expect(json.error).toContain("Git repository unavailable");
    expect(json.message).toContain("./update.sh");
  });

  it("supports non-git command mode success", async () => {
    process.env.SYSTEM_UPDATE_MODE = "docker";
    process.env.SYSTEM_UPDATE_COMMAND = "echo docker-update";

    mocks.existsSync.mockReturnValue(false);
    mockExecImplementation((command) => {
      if (command === "git rev-parse --is-inside-work-tree") {
        return new Error("fatal: not a git repository");
      }
      if (command === "echo docker-update") {
        return { stdout: "docker-update\n" };
      }
      return new Error(`Unexpected command: ${command}`);
    });

    const response = await POST(createRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.mode).toBe("docker");
    expect(json.changed).toBeNull();
    expect(json.message).toContain("Revision probe unavailable");
  });

  it("returns unsupported mode guidance when repo and alternative command are unavailable", async () => {
    delete process.env.SYSTEM_UPDATE_MODE;
    delete process.env.SYSTEM_UPDATE_COMMAND;

    mocks.existsSync.mockReturnValue(false);
    mockExecImplementation((command) => {
      if (command === "git rev-parse --is-inside-work-tree") {
        return new Error("fatal: not a git repository");
      }
      return new Error(`Unexpected command: ${command}`);
    });

    const response = await POST(createRequest());
    const json = await response.json();

    expect(response.status).toBe(422);
    expect(json.error).toContain("unsupported");
    expect(json.recommendation).toContain("update.bat");
  });
});
