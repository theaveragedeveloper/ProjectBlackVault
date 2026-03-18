import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionSecret } from "@/lib/session-config";

/**
 * Sign a raw token with HMAC-SHA256. Returns "<token>.<hmacHex>".
 * Used by Node.js API routes (login, auth/check).
 */
export function signToken(token: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret).update(token).digest("hex");
  return `${token}.${hmac}`;
}

export function createSessionToken(sessionVersion: number): string {
  return `${sessionVersion}:${crypto.randomBytes(32).toString("hex")}`;
}

export function extractSessionVersion(signed: string): number | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;

  const token = signed.slice(0, lastDot);
  const separator = token.indexOf(":");
  if (separator === -1) return null;

  const version = Number(token.slice(0, separator));
  if (!Number.isInteger(version) || version < 1) return null;
  return version;
}

/**
 * Verify a signed cookie value produced by signToken.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyTokenNode(signed: string, secret: string): boolean {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;
  const token = signed.slice(0, lastDot);
  const provided = signed.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", secret).update(token).digest("hex");
  try {
    if (provided.length !== expected.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export async function getSession(): Promise<{ authenticated: boolean }> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
    select: { appPassword: true, sessionVersion: true },
  });

  if (!settings?.appPassword) {
    return { authenticated: true };
  }

  const secret = getSessionSecret();
  if (!secret) return { authenticated: false };

  const cookieStore = await cookies();
  const signed = cookieStore.get("vault_session")?.value;
  if (!signed || !verifyTokenNode(signed, secret)) {
    return { authenticated: false };
  }

  const tokenVersion = extractSessionVersion(signed);
  const expectedVersion = settings.sessionVersion ?? 1;

  return { authenticated: tokenVersion !== null && tokenVersion === expectedVersion };
}
