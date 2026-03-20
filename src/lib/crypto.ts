import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const PREFIX = "enc:";

// In-memory key cache — avoids a DB round-trip on every encrypt/decrypt call.
// undefined = not yet loaded; null = confirmed no key in DB or env
let cachedKey: Buffer | null | undefined = undefined;

/** Call this whenever the encryption key is changed via the UI. */
export function clearKeyCache() {
  cachedKey = undefined;
}

function keyFromHex(hex: string): Buffer {
  if (hex.length !== 64) {
    throw new Error(
      `Encryption key must be 64 hex characters (32 bytes). Got ${hex.length} chars.`
    );
  }
  return Buffer.from(hex, "hex");
}

async function getKey(): Promise<Buffer | null> {
  // 1. Env var takes priority (power-user / Docker setup)
  if (process.env.VAULT_ENCRYPTION_KEY) {
    return keyFromHex(process.env.VAULT_ENCRYPTION_KEY);
  }
  // 2. Return cached DB value (null = confirmed absent)
  if (cachedKey !== undefined) return cachedKey;
  // 3. Load from database
  const { prisma } = await import("./prisma");
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  cachedKey = settings?.encryptionKey ? keyFromHex(settings.encryptionKey) : null;
  return cachedKey;
}

export async function encryptField(value: string): Promise<string> {
  const key = await getKey();
  if (!key) return value; // encryption not configured — store plaintext

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${ciphertext.toString("base64")}:${tag.toString("base64")}`;
}

export async function decryptField(value: string | null | undefined): Promise<string | null> {
  if (value == null) return null;
  if (!value.startsWith(PREFIX)) return value; // plaintext — backward compat

  const key = await getKey();
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
    return null;
  }
}
