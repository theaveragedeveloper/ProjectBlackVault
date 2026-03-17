const isProduction = process.env.NODE_ENV === "production";
const DEV_SESSION_SECRET = "blackvault-dev-session-secret-insecure";

function getSessionMaxAgeSeconds(): number {
  const raw = process.env.SESSION_MAX_AGE_SECONDS;
  const parsed = raw ? Number(raw) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 60 * 60 * 8; // 8 hours
  }

  return Math.max(5 * 60, Math.min(Math.floor(parsed), 60 * 60 * 24));
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (isProduction) {
    throw new Error("[blackvault] SESSION_SECRET must be set in production.");
  }

  return DEV_SESSION_SECRET;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge: getSessionMaxAgeSeconds(),
    secure: isProduction,
  };
}
