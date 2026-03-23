import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "blackvault_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSessionSigningSecret() {
  return (
    process.env.BLACKVAULT_SESSION_SECRET ??
    process.env.VAULT_ENCRYPTION_KEY ??
    process.env.NEXTAUTH_SECRET ??
    "blackvault-dev-session-secret"
  );
}

function buildSessionSignature(appPassword: string) {
  return createHmac("sha256", getSessionSigningSecret())
    .update(appPassword)
    .digest("hex");
}

async function getAppPassword() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
    select: { appPassword: true },
  });

  return settings?.appPassword ?? null;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function createSessionCookieValue(appPassword: string) {
  return buildSessionSignature(appPassword);
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export async function isPasswordModeEnabled() {
  return Boolean(await getAppPassword());
}

export async function hasValidSessionCookie() {
  const appPassword = await getAppPassword();
  if (!appPassword) return true;

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return false;

    const expected = createSessionCookieValue(appPassword);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(sessionCookie);

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

export async function requireAuth(): Promise<NextResponse | null> {
  const appPassword = await getAppPassword();
  if (!appPassword) {
    return null;
  }

  const sessionIsValid = await hasValidSessionCookie();
  if (sessionIsValid) {
    return null;
  }

  const response = NextResponse.json(
    { error: "Vault is locked. Unlock the vault and retry.", code: "VAULT_LOCKED" },
    { status: 401 }
  );
  clearSessionCookie(response);
  return response;
}
