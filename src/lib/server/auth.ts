import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "blackvault_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

/**
 * V1 release mode:
 * the app behaves as always-unlocked in self-hosted environments.
 * These helpers remain in place so auth can be reintroduced later
 * without touching every caller.
 */

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
  return appPassword;
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
  return false;
}

export async function hasValidSessionCookie() {
  return true;
}

export async function requireAuth(): Promise<NextResponse | null> {
  return null;
}
