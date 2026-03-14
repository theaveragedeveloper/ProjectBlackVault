import { exec } from "node:child_process";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenNode } from "@/lib/session";

const execAsync = promisify(exec);

export const runtime = "nodejs";

const UPDATE_DEFAULT_COMMAND = "git pull --ff-only";
const UPDATE_TIMEOUT_MS = Number(process.env.SYSTEM_UPDATE_TIMEOUT_MS ?? "120000");

type SystemUpdateMetadata = {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  source: string;
  checkedAt: string;
};

function isStatusRouteEnabled() {
  return process.env.SYSTEM_UPDATE_STATUS_ENABLED === "true";
}

function isExecutionEnabled() {
  return process.env.SYSTEM_UPDATE_EXEC_ENABLED === "true";
}

function isProductionAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.SYSTEM_UPDATE_ALLOW_PRODUCTION === "true";
}

function hasValidSession(request: NextRequest) {
  const sessionSecret = process.env.SESSION_SECRET;
  const sessionCookie = request.cookies.get("vault_session")?.value;

  if (!sessionSecret || !sessionCookie) {
    return false;
  }

  return verifyTokenNode(sessionCookie, sessionSecret);
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

export async function GET(request: NextRequest) {
  if (!isStatusRouteEnabled() || !isProductionAllowed()) {
    return NextResponse.json(
      {
        error: "System update endpoint is disabled.",
        message: "Enable SYSTEM_UPDATE_STATUS_ENABLED=true to allow update checks.",
      },
      { status: 404 }
    );
  }

  if (!hasValidSession(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({
    metadata: getMetadata(),
    writable: isExecutionEnabled(),
    message: isExecutionEnabled()
      ? "System update endpoint is enabled."
      : "Update checks are enabled, but command execution is disabled.",
  });
}

export async function POST(request: NextRequest) {
  if (!isStatusRouteEnabled() || !isProductionAllowed()) {
    return NextResponse.json(
      {
        error: "System update endpoint is disabled.",
        message: "Enable SYSTEM_UPDATE_STATUS_ENABLED=true to permit application update operations.",
      },
      { status: 404 }
    );
  }

  if (!isExecutionEnabled()) {
    return NextResponse.json(
      {
        error: "System update command execution is disabled.",
        message: "Set SYSTEM_UPDATE_EXEC_ENABLED=true to allow update command execution.",
      },
      { status: 403 }
    );
  }

  if (!hasValidSession(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const requestedCommand = process.env.SYSTEM_UPDATE_COMMAND?.trim() || UPDATE_DEFAULT_COMMAND;
  const postCommand = process.env.SYSTEM_UPDATE_POST_COMMAND?.trim();

  try {
    const before = await runShellCommand("git rev-parse --short HEAD");
    const updateOutput = await runShellCommand(requestedCommand);
    const after = await runShellCommand("git rev-parse --short HEAD");

    const commandLogs = [
      `Command: ${requestedCommand}`,
      `Timeout(ms): ${UPDATE_TIMEOUT_MS}`,
      `Before: ${before}`,
      `After: ${after}`,
      "",
      updateOutput || "No output from update command.",
    ];

    if (postCommand) {
      const postOutput = await runShellCommand(postCommand);
      commandLogs.push("", `Post-command: ${postCommand}`, "", postOutput || "No output from post-command.");
    }

    return NextResponse.json({
      ok: true,
      changed: before !== after,
      output: commandLogs.join("\n"),
      metadata: getMetadata(),
      message: before === after ? "Update command completed. No version change detected." : "Update completed successfully.",
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
