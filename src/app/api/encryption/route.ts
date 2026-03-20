import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { encryptionSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clearKeyCache } from "@/lib/crypto";
import { getClientIp } from "@/lib/server/client-ip";
import crypto from "crypto";
import { requireAuth } from "@/lib/server/auth";

const HEX_KEY_RE = /^[0-9a-fA-F]{64}$/;
const isProduction = process.env.NODE_ENV === "production";

function parseBooleanEnv(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

const allowDbKeyManagement = parseBooleanEnv(process.env.ALLOW_DB_ENCRYPTION_KEY_MANAGEMENT);
const allowKeyExport = parseBooleanEnv(process.env.ALLOW_ENCRYPTION_KEY_EXPORT);

// GET /api/encryption — export the DB-stored key (not shown if set via env var)
export async function GET() {
  try {
    if (isProduction && !allowKeyExport) {
      return NextResponse.json(
        { error: "Encryption key export is disabled in production." },
        { status: 403 }
      );
    }

    // Never expose a key that was set via env var — it's managed outside the app
    if (process.env.VAULT_ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: "Key is managed via environment variable" },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    if (!settings?.encryptionKey) {
      return NextResponse.json(
        { error: "No encryption key configured" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { key: settings.encryptionKey },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    console.error("GET /api/encryption failed");
    return NextResponse.json({ error: "Failed to retrieve key" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}


// POST /api/encryption — generate a new random key and save it
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    if (isProduction && !allowDbKeyManagement) {
      return NextResponse.json(
        { error: "UI key generation is disabled in production. Set VAULT_ENCRYPTION_KEY instead." },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `encryption:generate:${ip}`, windowMs: 60_000, maxAttempts: 5 });
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    if (process.env.VAULT_ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: "Encryption is already active via environment variable. Remove VAULT_ENCRYPTION_KEY to use the UI setup instead." },
        { status: 409 }
      );
    }

    const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    if (settings?.encryptionKey) {
      return NextResponse.json(
        { error: "An encryption key is already configured. Delete it first before generating a new one." },
        { status: 409 }
      );
    }

    const key = crypto.randomBytes(32).toString("hex");

    await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: { encryptionKey: key },
      create: { id: "singleton", encryptionKey: key },
    });

    clearKeyCache();

    return NextResponse.json({ key }, { status: 201 });
  } catch {
    console.error("POST /api/encryption failed");
    return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });
  }
}

// PUT /api/encryption — save a user-supplied key
export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    if (isProduction && !allowDbKeyManagement) {
      return NextResponse.json(
        { error: "UI key management is disabled in production. Set VAULT_ENCRYPTION_KEY instead." },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `encryption:import:${ip}`, windowMs: 60_000, maxAttempts: 5 });
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    if (process.env.VAULT_ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: "Encryption is managed via environment variable" },
        { status: 409 }
      );
    }

    const { key } = await parseJsonBody(request, encryptionSchemas.importKey, { maxBytes: 16 * 1024 });

    if (typeof key !== "string" || !HEX_KEY_RE.test(key)) {
      return NextResponse.json(
        { error: "Key must be exactly 64 hexadecimal characters (a 32-byte AES-256 key)" },
        { status: 400 }
      );
    }

    await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: { encryptionKey: key },
      create: { id: "singleton", encryptionKey: key },
    });

    clearKeyCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error as { status?: number }).status) {
      return validationErrorResponse(error, "Invalid encryption payload");
    }
    console.error("PUT /api/encryption error:", error);
    return NextResponse.json({ error: "Failed to save key" }, { status: 500 });
  }
}

// DELETE /api/encryption — remove the DB-stored key (disables encryption)
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    if (isProduction && !allowDbKeyManagement) {
      return NextResponse.json(
        { error: "UI key management is disabled in production. Set VAULT_ENCRYPTION_KEY instead." },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `encryption:delete:${ip}`, windowMs: 60_000, maxAttempts: 5 });
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    if (process.env.VAULT_ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: "Encryption is managed via environment variable. Remove VAULT_ENCRYPTION_KEY from your environment to disable it." },
        { status: 409 }
      );
    }

    await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: { encryptionKey: null },
      create: { id: "singleton" },
    });

    clearKeyCache();

    return NextResponse.json({ success: true });
  } catch {
    console.error("DELETE /api/encryption failed");
    return NextResponse.json({ error: "Failed to remove key" }, { status: 500 });
  }
}
