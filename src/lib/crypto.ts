import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const PREFIX = "enc:";

function getKey(): Buffer | null {
  const hex = process.env.VAULT_ENCRYPTION_KEY;
  if (!hex) return null;
  if (hex.length !== 64) {
    throw new Error(
      `VAULT_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${hex.length} chars.`
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptField(value: string): string {
  const key = getKey();
  if (!key) return value; // encryption not configured — store plaintext

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${ciphertext.toString("base64")}:${tag.toString("base64")}`;
}

export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith(PREFIX)) return value; // plaintext — backward compat

  const key = getKey();
  if (!key) return value; // key not configured — return raw (won't be readable)

  try {
    const parts = value.slice(PREFIX.length).split(":");
    if (parts.length !== 3) throw new Error("Invalid ciphertext format");

    const [ivB64, ciphertextB64, tagB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");
    const tag = Buffer.from(tagB64, "base64");

    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    return "[decryption error — wrong key?]";
  }
}
