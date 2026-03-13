import { NextRequest, NextResponse } from "next/server";
import { verifyTokenNode } from "@/lib/session";

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

function isProductionAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.SYSTEM_UPDATE_ALLOW_PRODUCTION === "true";
}

function requireElevatedAdmin(request: NextRequest) {
  const adminToken = process.env.SYSTEM_UPDATE_ADMIN_TOKEN;
  const sessionSecret = process.env.SESSION_SECRET;
  const sessionCookie = request.cookies.get("vault_session")?.value;

  if (!adminToken || !sessionSecret || !sessionCookie) {
    return false;
  }

  const headerToken = request.headers.get("x-system-update-admin-token");
  if (!headerToken || headerToken !== adminToken) {
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

function endpointDisabledResponse() {
  return NextResponse.json(
    {
      error: "System update endpoint is disabled.",
      message:
        "Application self-update has been deprecated. Move updates to host-level operations (systemd/cron/CI/CD).",
    },
    { status: 404 }
  );
}

export async function GET(request: NextRequest) {
  if (!isStatusRouteEnabled() || !isProductionAllowed()) {
    return endpointDisabledResponse();
  }

  if (!requireElevatedAdmin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({
    metadata: getMetadata(),
    writable: false,
    message: "Read-only system update metadata endpoint.",
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint.",
      message:
        "POST /api/system-update has been removed. Execute updates via host-level operations (systemd/cron/CI/CD).",
    },
    { status: 410 }
  );
}
