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
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
    select: { appPassword: true, sessionVersion: true },
  });

  // No password configured → app is in open (password-free) mode
  if (!settings?.appPassword) return null;

  const cookieStore = await cookies();
  const session = cookieStore.get("vault_session");
  const secret = getSessionSecret();

  if (!session?.value || !secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!verifyTokenNode(session.value, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenVersion = extractSessionVersion(session.value);
  const expectedVersion = settings.sessionVersion ?? 1;

  if (tokenVersion === null || tokenVersion !== expectedVersion) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
