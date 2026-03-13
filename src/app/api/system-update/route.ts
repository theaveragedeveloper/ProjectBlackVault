import { NextResponse } from "next/server";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const execFileAsync = promisify(execFile);

async function runGit(args: string[]) {
  return execFileAsync("git", args, {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
  });
}

async function ensureRepoContext() {
  const insideRepo = await runGit(["rev-parse", "--is-inside-work-tree"]);
  if (insideRepo.stdout.trim() !== "true") {
    return { error: "Application is not running from a Git repository." };
  }

  const branchResult = await runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
  const branch = branchResult.stdout.trim();
  const remoteResult = await runGit(["remote", "get-url", "origin"]);
  const remote = remoteResult.stdout.trim();

  return { branch, remote };
}

export async function GET() {
  try {
    const context = await ensureRepoContext();
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: 400 });
    }

    const { branch, remote } = context;
    await runGit(["fetch", "origin", branch]);
    const behindResult = await runGit(["rev-list", "--count", `HEAD..origin/${branch}`]);
    const behind = Number.parseInt(behindResult.stdout.trim(), 10) || 0;

    return NextResponse.json({
      branch,
      remote,
      updateAvailable: behind > 0,
      commitsBehind: behind,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check for updates.";
    return NextResponse.json(
      {
        error: "Failed to check for updates.",
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const context = await ensureRepoContext();
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: 400 });
    }

    const { branch, remote } = context;

    const pullResult = await runGit(["pull", "--ff-only", "origin", branch]);
    const output = `${pullResult.stdout}${pullResult.stderr}`.trim();

    return NextResponse.json({
      branch,
      remote,
      output: output || "Already up to date.",
      message: "Git update completed. Restart the app if dependencies or runtime files changed.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to pull updates from GitHub.";
    return NextResponse.json(
      {
        error: "Failed to pull updates from GitHub.",
        details: message,
      },
      { status: 500 }
    );
  }
}
