type RuntimeValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const BOOLEAN_TEXT_VALUES = new Set(["true", "false"]);
const COOKIE_SECURE_VALUES = new Set(["auto", "true", "false", "1", "0", "yes", "no"]);

let cachedValidation: RuntimeValidationResult | null = null;

function isValidIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    const parsed = Number.parseInt(part, 10);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
      return false;
    }
  }
  return true;
}

function isValidBindAddress(value: string): boolean {
  if (value === "localhost") return true;
  return isValidIpv4(value);
}

function validatePort(portRaw: string | undefined) {
  if (!portRaw || !portRaw.trim()) return;
  const trimmed = portRaw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("PORT must be a number between 1 and 65535.");
  }
  const port = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a number between 1 and 65535.");
  }
}

export function validateRuntimeConfig(): RuntimeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (!databaseUrl) {
    errors.push("DATABASE_URL is required. Example: file:/app/data/vault.db");
  } else if (!databaseUrl.startsWith("file:")) {
    errors.push("DATABASE_URL must use a SQLite file URL (must start with file:).");
  } else if (!databaseUrl.slice("file:".length).trim()) {
    errors.push("DATABASE_URL must include a file path after file:.");
  }

  const sessionSecret = process.env.SESSION_SECRET?.trim();
  if (sessionSecret && sessionSecret.length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters when set.");
  }

  const sessionCookieSecure = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (sessionCookieSecure && !COOKIE_SECURE_VALUES.has(sessionCookieSecure)) {
    errors.push(
      "SESSION_COOKIE_SECURE must be one of: auto, true, false, 1, 0, yes, no."
    );
  }
  if (sessionCookieSecure === "false" || sessionCookieSecure === "0" || sessionCookieSecure === "no") {
    warnings.push("SESSION_COOKIE_SECURE is disabled. Use HTTPS for any non-local exposure.");
  }

  const encryptionKey = process.env.VAULT_ENCRYPTION_KEY?.trim();
  if (encryptionKey && !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    errors.push("VAULT_ENCRYPTION_KEY must be exactly 64 hexadecimal characters.");
  }

  const exportToggle = process.env.ALLOW_ENCRYPTION_KEY_EXPORT?.trim().toLowerCase();
  if (exportToggle && !BOOLEAN_TEXT_VALUES.has(exportToggle)) {
    errors.push("ALLOW_ENCRYPTION_KEY_EXPORT must be true or false.");
  }
  if (exportToggle === "true") {
    warnings.push("ALLOW_ENCRYPTION_KEY_EXPORT=true exposes encryption key export in the UI/API.");
  }

  const bindAddress = process.env.BIND_ADDRESS?.trim();
  if (bindAddress) {
    if (!isValidBindAddress(bindAddress)) {
      errors.push("BIND_ADDRESS must be localhost or a valid IPv4 address (for example 127.0.0.1 or 0.0.0.0).");
    } else if (bindAddress === "0.0.0.0") {
      warnings.push("BIND_ADDRESS=0.0.0.0 allows other devices on your local network to access this app.");
    }
  }

  const imageUploadDir = process.env.IMAGE_UPLOAD_DIR?.trim();
  if (imageUploadDir !== undefined && imageUploadDir.length === 0) {
    warnings.push("IMAGE_UPLOAD_DIR is set but empty. Uploads will use the default local folder.");
  }

  try {
    validatePort(process.env.PORT);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "PORT is invalid.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function getRuntimeConfigValidation(force = false): RuntimeValidationResult {
  if (!force && cachedValidation) return cachedValidation;
  cachedValidation = validateRuntimeConfig();
  return cachedValidation;
}

export function clearRuntimeConfigValidationCache() {
  cachedValidation = null;
}

export function assertRuntimeConfig() {
  const result = getRuntimeConfigValidation();
  if (result.ok) return;

  const details = result.errors.map((line) => `- ${line}`).join("\n");
  throw new Error(
    `Invalid runtime configuration.\n${details}\nSee README.md and NON_TECHNICAL_INSTALL.md for setup guidance.`
  );
}
