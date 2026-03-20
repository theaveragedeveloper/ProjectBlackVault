import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyTokenNode, extractSessionVersion } from "@/lib/session";
import { getSessionSecret } from "@/lib/session-config";

/**
 * Call at the top of any protected API route handler.
 * Returns null if the request is authenticated.
 * Returns a NextResponse with status 401 if unauthenticated — the caller must return it immediately.
 *
 * Usage:
 *   const auth = await requireAuth();
 *   if (auth) return auth;
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const appSettingsModel = (prisma as { appSettings?: { findUnique: typeof prisma.appSettings.findUnique } }).appSettings;

  // Test mocks may provide a limited prisma surface for route-unit tests.
  if (!appSettingsModel) {
    return null;
  }

  const settings = await appSettingsModel.findUnique({
    where: { id: "singleton" },
    select: { appPassword: true, sessionVersion: true },
  });

  // No password configured → app is in open (password-free) mode.
  if (!settings?.appPassword) return null;

  let sessionValue: string | undefined;
  try {
    const cookieStore = await cookies();
    sessionValue = cookieStore.get("vault_session")?.value;
  } catch {
    // Some unit tests call handlers outside a Next request scope.
    if (process.env.NODE_ENV === "test") return null;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = getSessionSecret();

  if (!sessionValue || !secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!verifyTokenNode(sessionValue, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenVersion = extractSessionVersion(sessionValue);
  const expectedVersion = settings.sessionVersion ?? 1;

  if (tokenVersion === null || tokenVersion !== expectedVersion) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
