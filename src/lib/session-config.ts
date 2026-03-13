const isProduction = process.env.NODE_ENV === "production";

export function getSessionSecret(): string | undefined {
  const secret = process.env.SESSION_SECRET;

  if (isProduction && !secret) {
    throw new Error("[blackvault] SESSION_SECRET must be set in production.");
  }

  return secret;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: isProduction,
  };
}
