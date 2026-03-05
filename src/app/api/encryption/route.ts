import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearKeyCache } from "@/lib/crypto";
import crypto from "crypto";

const HEX_KEY_RE = /^[0-9a-fA-F]{64}$/;

// GET /api/encryption — export the DB-stored key (not shown if set via env var)
export async function GET() {
  try {
    // Never expose a key that was set via env var — it's managed outside the app
    if (process.env.VAULT_ENCRYPTION_KEY) {
      return NextResponse.json({ error: "Key is managed via environment variable" }, { status: 403 });
    }

    const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    if (!settings?.encryptionKey) {
      return NextResponse.json({ error: "No encryption key configured" }, { status: 404 });
    }

    return NextResponse.json({ key: settings.encryptionKey });
  } catch (error) {
    console.error("GET /api/encryption error:", error);
    return NextResponse.json({ error: "Failed to retrieve key" }, { status: 500 });
  }
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

    return NextResponse.json({ key }, { status: 201 });
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

    return NextResponse.json({ success: true });
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
