import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenNode } from "@/lib/session";
import { getClientIp } from "@/lib/server/client-ip";
import { isPrivateClientIp, requirePrivateNetworkForUpdates } from "@/lib/network-policy";

const execAsync = promisify(exec);

export const runtime = "nodejs";

const UPDATE_DEFAULT_COMMAND = "git pull --ff-only";
const UPDATE_TIMEOUT_MS = Number(process.env.SYSTEM_UPDATE_TIMEOUT_MS ?? "120000");
const UPDATE_MODE_UNSUPPORTED_STATUS = 422;

type SystemUpdateMetadata = {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  source: string;
  checkedAt: string;
};

type SystemUpdateMode = "git" | "docker";

type ExecutionContext = {
  mode: SystemUpdateMode | null;
  repoAvailable: boolean;
  hasAlternativeCommand: boolean;
};

function isStatusRouteEnabled() {
  return process.env.SYSTEM_UPDATE_STATUS_ENABLED !== "false";
}

function isExecutionEnabled() {
  return process.env.SYSTEM_UPDATE_EXEC_ENABLED !== "false";
}

function isProductionAllowed() {
  return process.env.SYSTEM_UPDATE_ALLOW_PRODUCTION !== "false";
}

function hasValidSession(request: NextRequest) {
  const sessionSecret = process.env.SESSION_SECRET;
  const sessionCookie = request.cookies.get("vault_session")?.value;

  if (!sessionSecret || !sessionCookie) {
    return false;
  }

  return verifyTokenNode(sessionCookie, sessionSecret);
}

function isUpdateClientNetworkAllowed(request: NextRequest): boolean {
  if (!requirePrivateNetworkForUpdates()) {
    return true;
  }

  const clientIp = getClientIp(request);
  return isPrivateClientIp(clientIp);
}

function getMetadata(): SystemUpdateMetadata {
  const currentVersion = process.env.APP_VERSION ?? process.env.npm_package_version ?? null;
  const latestVersion = process.env.SYSTEM_UPDATE_LATEST_VERSION ?? null;

  return {
    currentVersion,
    latestVersion,
    updateAvailable: !!latestVersion && !!currentVersion && latestVersion !== currentVersion,
    source: process.env.SYSTEM_UPDATE_STATUS_SOURCE ?? "environment",
    checkedAt: new Date().toISOString(),
  };
}

async function runShellCommand(command: string) {
  const { stdout, stderr } = await execAsync(command, {
    cwd: process.cwd(),
    env: process.env,
    shell: "/bin/bash",
    timeout: UPDATE_TIMEOUT_MS,
    maxBuffer: 1024 * 1024 * 10,
  });

  return [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
}

async function isGitRepoAvailable() {
  if (existsSync(path.join(process.cwd(), ".git"))) {
    return true;
  }

  try {
    await runShellCommand("git rev-parse --is-inside-work-tree");
    return true;
  } catch {
    return false;
  }
}

async function probeRevision() {
  try {
    return await runShellCommand("git rev-parse --short HEAD");
  } catch {
    return null;
  }
}

async function resolveExecutionContext(): Promise<ExecutionContext> {
  const configuredMode = (process.env.SYSTEM_UPDATE_MODE ?? "auto").trim().toLowerCase();
  const commandFromEnv = process.env.SYSTEM_UPDATE_COMMAND?.trim();
  const hasAlternativeCommand = Boolean(commandFromEnv);
  const repoAvailable = await isGitRepoAvailable();

  if (configuredMode === "git") {
    return { mode: "git", repoAvailable, hasAlternativeCommand };
  }

  if (configuredMode === "docker") {
    return { mode: "docker", repoAvailable, hasAlternativeCommand };
  }

  if (repoAvailable) {
    return { mode: "git", repoAvailable, hasAlternativeCommand };
  }

  if (hasAlternativeCommand) {
    return { mode: "docker", repoAvailable, hasAlternativeCommand };
  }

  return { mode: null, repoAvailable, hasAlternativeCommand };
}

function getUnsupportedModeResponse() {
  return NextResponse.json(
    {
      error: "In-app update is unsupported for this deployment.",
      message:
        "No git repository is available and no SYSTEM_UPDATE_COMMAND is configured. Use ./update.sh (Linux/macOS) or update.bat (Windows) from the host instead.",
      recommendation: "Run ./update.sh or update.bat on the host machine.",
    },
    { status: UPDATE_MODE_UNSUPPORTED_STATUS }
  );
}

export async function GET(request: NextRequest) {
  if (!isStatusRouteEnabled() || !isProductionAllowed()) {
    return NextResponse.json(
      {
        error: "System update endpoint is disabled.",
        message:
          "Set SYSTEM_UPDATE_STATUS_ENABLED=true and SYSTEM_UPDATE_ALLOW_PRODUCTION=true (or unset both) to allow update checks.",
      },
      { status: 404 }
    );
  }

  if (!hasValidSession(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!isUpdateClientNetworkAllowed(request)) {
    return NextResponse.json(
      {
        error: "Update checks are restricted to private/VPN networks by policy.",
        message:
          "Connect through your private LAN/VPN or set SYSTEM_UPDATE_REQUIRE_PRIVATE_NETWORK=false to override.",
      },
      { status: 403 }
    );
  }

  const execution = await resolveExecutionContext();

  return NextResponse.json({
    metadata: getMetadata(),
    writable: isExecutionEnabled() && execution.mode !== null,
    mode: execution.mode,
    message: isExecutionEnabled()
      ? "System update endpoint is enabled."
      : "Update checks are enabled, but command execution is disabled.",
    unsupported:
      execution.mode === null
        ? "In-app git updates are unavailable in this deployment. Configure SYSTEM_UPDATE_COMMAND for docker mode or run ./update.sh / update.bat on the host."
        : null,
  });
}

export async function POST(request: NextRequest) {
  if (!isStatusRouteEnabled() || !isProductionAllowed()) {
    return NextResponse.json(
      {
        error: "System update endpoint is disabled.",
        message:
          "Set SYSTEM_UPDATE_STATUS_ENABLED=true and SYSTEM_UPDATE_ALLOW_PRODUCTION=true (or unset both) to permit update operations.",
      },
      { status: 404 }
    );
  }

  if (!isExecutionEnabled()) {
    return NextResponse.json(
      {
        error: "System update command execution is disabled.",
        message: "Set SYSTEM_UPDATE_EXEC_ENABLED=true (or unset it) to allow update command execution.",
      },
      { status: 403 }
    );
  }

  if (!hasValidSession(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!isUpdateClientNetworkAllowed(request)) {
    return NextResponse.json(
      {
        error: "Update execution is restricted to private/VPN networks by policy.",
        message:
          "Connect through your private LAN/VPN or set SYSTEM_UPDATE_REQUIRE_PRIVATE_NETWORK=false to override.",
      },
      { status: 403 }
    );
  }

  const requestedCommand = process.env.SYSTEM_UPDATE_COMMAND?.trim() || UPDATE_DEFAULT_COMMAND;
  const postCommand = process.env.SYSTEM_UPDATE_POST_COMMAND?.trim();
  const execution = await resolveExecutionContext();

  if (execution.mode === null) {
    return getUnsupportedModeResponse();
  }

  if (execution.mode === "git" && !execution.repoAvailable) {
    return NextResponse.json(
      {
        error: "Git repository unavailable for in-app update.",
        message:
          "This deployment does not expose a working git checkout for in-app updates. Run ./update.sh or update.bat from the host machine, or configure docker mode with SYSTEM_UPDATE_MODE=docker and SYSTEM_UPDATE_COMMAND.",
      },
      { status: UPDATE_MODE_UNSUPPORTED_STATUS }
    );
  }

  try {
    const before = execution.mode === "git" ? await probeRevision() : null;
    const updateOutput = await runShellCommand(requestedCommand);
    const after = execution.mode === "git" ? await probeRevision() : null;

    const changed = before && after ? before !== after : null;

    const commandLogs = [
      `Mode: ${execution.mode}`,
      `Command: ${requestedCommand}`,
      `Timeout(ms): ${UPDATE_TIMEOUT_MS}`,
      `Before: ${before ?? "Unavailable"}`,
      `After: ${after ?? "Unavailable"}`,
      "",
      updateOutput || "No output from update command.",
    ];

    if (postCommand) {
      const postOutput = await runShellCommand(postCommand);
      commandLogs.push("", `Post-command: ${postCommand}`, "", postOutput || "No output from post-command.");
    }

    return NextResponse.json({
      ok: true,
      changed,
      mode: execution.mode,
      output: commandLogs.join("\n"),
      metadata: getMetadata(),
      message:
        changed === null
          ? "Update command completed. Revision probe unavailable for this deployment."
          : changed
            ? "Update completed successfully."
            : "Update command completed. No version change detected.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Update command failed.",
        details: error instanceof Error ? error.message : "Unknown update command failure.",
      },
      { status: 500 }
    );
  }
}
