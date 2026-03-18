import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  authenticated: boolean;
}

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
) {
  console.warn(
    "[BlackVault] WARNING: SESSION_SECRET is missing or too short. Sessions are insecure."
  );
}

export const sessionOptions = {
  cookieName: "bv_session",
  password:
    process.env.SESSION_SECRET ??
    "dev-only-secret-change-in-production-at-least-32-chars",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
