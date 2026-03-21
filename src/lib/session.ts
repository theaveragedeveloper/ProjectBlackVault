import crypto from "crypto";
import fs from "fs";
import path from "path";

export const SESSION_COOKIE_NAME = "vault_session";
const MIN_SESSION_SECRET_LENGTH = 32;
const SESSION_SECRET_FILE_NAME = "session-secret";

let cachedSessionSecret: string | null = null;

function isValidSessionSecret(secret: string | null | undefined): secret is string {
  return typeof secret === "string" && secret.trim().length >= MIN_SESSION_SECRET_LENGTH;
}

function resolveSessionSecretFilePath(): string {
  const secretFileOverride = process.env.SESSION_SECRET_FILE?.trim();
  if (secretFileOverride) {
    return path.resolve(secretFileOverride);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (databaseUrl.startsWith("file:")) {
    const databasePathRaw = databaseUrl.slice("file:".length);
    const databasePath = path.isAbsolute(databasePathRaw)
      ? databasePathRaw
      : path.resolve(process.cwd(), databasePathRaw);
    return path.join(path.dirname(databasePath), SESSION_SECRET_FILE_NAME);
  }

  return path.resolve(process.cwd(), "data", SESSION_SECRET_FILE_NAME);
}

function readSecretFromFile(filePath: string): string | null {
  try {
    const secret: string = fs.readFileSync(filePath, "utf8").trim();

    if (secret && secret.length >= MIN_SESSION_SECRET_LENGTH) {
      return secret;
    }

    if (secret && secret.length > 0) {
      console.error(
        `Session secret file exists but is shorter than ${MIN_SESSION_SECRET_LENGTH} characters: ${filePath}`
      );
    }
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code !== "ENOENT") {
      console.error(`Failed reading session secret file: ${filePath}`, error);
    }
  }
  return null;
}

function writeSecretToFile(filePath: string, secret: string) {
  const secretDir = path.dirname(filePath);
  fs.mkdirSync(secretDir, { recursive: true, mode: 0o700 });

  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, secret, { mode: 0o600 });
  fs.renameSync(tmpPath, filePath);
  fs.chmodSync(filePath, 0o600);
}

export function ensureSessionSecret(): string | null {
  if (isValidSessionSecret(cachedSessionSecret)) {
    return cachedSessionSecret;
  }

  const envSecret = process.env.SESSION_SECRET?.trim();
  if (isValidSessionSecret(envSecret)) {
    cachedSessionSecret = envSecret;
    return envSecret;
  }

  const secretFilePath = resolveSessionSecretFilePath();
  const fileSecret = readSecretFromFile(secretFilePath);
  if (fileSecret) {
    process.env.SESSION_SECRET = fileSecret;
    cachedSessionSecret = fileSecret;
    return fileSecret;
  }

  try {
    const generatedSecret = crypto.randomBytes(64).toString("hex");
    writeSecretToFile(secretFilePath, generatedSecret);
    process.env.SESSION_SECRET = generatedSecret;
    cachedSessionSecret = generatedSecret;
    return generatedSecret;
  } catch (error) {
    console.error("Failed to initialize SESSION_SECRET.", error);
    return null;
  }
}

export function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (isValidSessionSecret(secret)) {
    cachedSessionSecret = secret;
    return secret;
  }
  return ensureSessionSecret();
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
