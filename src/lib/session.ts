import crypto from "crypto";

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
