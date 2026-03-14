import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { encryptionSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clearKeyCache } from "@/lib/crypto";
import { getClientIp } from "@/lib/server/client-ip";
import crypto from "crypto";

const HEX_KEY_RE = /^[0-9a-fA-F]{64}$/;

// POST /api/encryption — generate a new random key and save it
export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error("POST /api/encryption error:", error);
    return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });
  }
}

// PUT /api/encryption — save a user-supplied key
export async function PUT(request: NextRequest) {
  try {
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
  try {
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
  } catch (error) {
    console.error("DELETE /api/encryption error:", error);
    return NextResponse.json({ error: "Failed to remove key" }, { status: 500 });
  }
}
