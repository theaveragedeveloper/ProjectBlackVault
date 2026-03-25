/**
 * crypto.ts — V1: no encryption.
 * encryptField is a passthrough; decryptField unwraps any legacy enc:... values
 * from pre-V1 builds so old data stays readable.
 */

import { createDecipheriv } from "crypto";

const PREFIX = "enc:";

export function encryptField(value: string): string {
  return value; // plain text storage in V1
}

export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith(PREFIX)) return value; // already plain text

  // Legacy encrypted value — attempt to decrypt using the stored key if present
  const hex = process.env.VAULT_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return value; // key missing, return raw

  try {
const key = Buffer.from(hex, "hex");
    const parts = value.slice(PREFIX.length).split(":");
    if (parts.length !== 3) return value;
    const [ivB64, ciphertextB64, tagB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    return "[unreadable — wrong key?]";
  }
}
