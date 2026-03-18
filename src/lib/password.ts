import crypto from "crypto";

// Format: "scrypt:<salt>:<hash>"
const PREFIX = "scrypt:";
const SALT_BYTES = 16;
const KEY_LEN = 64;
// Use explicit, stronger-than-default scrypt parameters (OWASP recommends N≥65536)
const SCRYPT_PARAMS = {
  N: 65536,
  r: 8,
  p: 1,
  maxmem: 128 * 1024 * 1024,
} as const;

/**
 * Hash a plaintext password using scrypt. Returns a storable string.
 */
export function hashPassword(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto.scryptSync(plaintext, salt, KEY_LEN, SCRYPT_PARAMS).toString("hex");
  return `${PREFIX}${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored hash (or legacy plaintext).
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyPassword(plaintext: string, stored: string): boolean {
  if (!stored) return false;

  if (stored.startsWith(PREFIX)) {
    // Hashed password — extract salt and expected hash
    const rest = stored.slice(PREFIX.length);
    const sep = rest.indexOf(":");
    if (sep === -1) return false;
    const salt = rest.slice(0, sep);
    const expectedHash = rest.slice(sep + 1);
    try {
      const actualHash = crypto.scryptSync(plaintext, salt, KEY_LEN, SCRYPT_PARAMS).toString("hex");
      return crypto.timingSafeEqual(
        Buffer.from(actualHash, "hex"),
        Buffer.from(expectedHash, "hex")
      );
    } catch {
      return false;
    }
  }

  // Legacy plaintext fallback (migrates on next successful login via settings save)
  const a = Buffer.from(plaintext, "utf8");
  const b = Buffer.from(stored, "utf8");
  if (a.byteLength !== b.byteLength) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Returns true if the stored value is already a hashed password.
 */
export function isHashed(stored: string): boolean {
  return stored.startsWith(PREFIX);
}
