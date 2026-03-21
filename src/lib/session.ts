import crypto from "crypto";

export const SESSION_COOKIE_NAME = "vault_session";
const MIN_SESSION_SECRET_LENGTH = 32;

export function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < MIN_SESSION_SECRET_LENGTH) {
    return null;
  }
  return secret;
}

/**
 * Sign a raw token with HMAC-SHA256. Returns "token.hmachex".
 * Used by Node.js API routes (login, auth/check).
 */
export function signToken(token: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret).update(token).digest("hex");
  return `${token}.${hmac}`;
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
  if (!/^[0-9a-f]+$/i.test(provided)) return false;
  const expected = crypto.createHmac("sha256", secret).update(token).digest("hex");
  try {
    if (provided.length !== expected.length) return false;
    const providedBuffer = Buffer.from(provided, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (providedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(
      providedBuffer,
      expectedBuffer
    );
  } catch {
    return false;
  }
}
