import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearKeyCache } from "@/lib/crypto";
import crypto from "crypto";

const HEX_KEY_RE = /^[0-9a-fA-F]{64}$/;

function getMaskedKeyFingerprint(key: string) {
  return {
    masked: `${key.slice(0, 4)}…${key.slice(-4)}`,
    digest: crypto.createHash("sha256").update(key, "utf8").digest("hex"),
  };
}

// GET /api/encryption — intentionally disabled to avoid exposing key material after creation
export async function GET() {
  return NextResponse.json(
    { error: "Retrieving full encryption keys is disabled for security." },
    { status: 405 }
  );
}

// POST /api/encryption — generate a new random key and save it
export async function POST() {
  try {
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

    return NextResponse.json({ key, fingerprint: getMaskedKeyFingerprint(key) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/encryption error:", error);
    return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });
  }
}

// PUT /api/encryption — save a user-supplied key
export async function PUT(request: NextRequest) {
  try {
    if (process.env.VAULT_ENCRYPTION_KEY) {
      return NextResponse.json(
        { error: "Encryption is managed via environment variable" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { key } = body;

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

    return NextResponse.json({ success: true, fingerprint: getMaskedKeyFingerprint(key) });
  } catch (error) {
    console.error("PUT /api/encryption error:", error);
    return NextResponse.json({ error: "Failed to save key" }, { status: 500 });
  }
}

// DELETE /api/encryption — remove the DB-stored key (disables encryption)
export async function DELETE() {
  try {
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
