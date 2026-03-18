import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/request";
import { backupSchemas } from "@/lib/validation/schemas/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { collectBackupData, latestBackupChangeToken } from "@/lib/backup";
import { requireAuth } from "@/lib/server/auth";

type AutoBackupState = {
  lastToken: number;
  lastBackupAt: string;
  lastFile: string;
};

function encryptForServerBackup(payload: unknown, passphrase: string) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const iterations = 250_000;
  const key = crypto.pbkdf2Sync(passphrase, salt, iterations, 32, "sha256");

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    type: "blackvault-encrypted-backup",
    version: 1,
    generatedAt: new Date().toISOString(),
    kdf: {
      algorithm: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: salt.toString("base64"),
    },
    cipher: {
      algorithm: "AES-256-GCM",
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    },
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const ip = getClientIp(request);
    const rate = await enforceRateLimit({ key: `backup:auto:${ip}`, windowMs: 60_000, maxAttempts: 10 });
    if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const autoPassphrase = process.env.AUTO_BACKUP_PASSPHRASE;
    if (!autoPassphrase) {
      return NextResponse.json(
        { error: "AUTO_BACKUP_PASSPHRASE is not set on the server" },
        { status: 400 }
      );
    }

    const body = await parseJsonBody(request, backupSchemas.auto, { maxBytes: 32 * 1024 });
    const includeDocumentFiles = body?.includeDocumentFiles !== false;
    const force = body?.force === true;

    const data = await collectBackupData(includeDocumentFiles);
    const token = latestBackupChangeToken(data);

    const backupDir = path.join(process.cwd(), "backups");
    const statePath = path.join(backupDir, ".auto-backup-state.json");

    await fs.mkdir(backupDir, { recursive: true });

    let priorState: AutoBackupState | null = null;
    try {
      const raw = await fs.readFile(statePath, "utf8");
      priorState = JSON.parse(raw) as AutoBackupState;
    } catch {
      priorState = null;
    }

    if (!force && priorState && priorState.lastToken === token) {
      return NextResponse.json({
        ok: true,
        created: false,
        reason: "No data changes since last automatic backup",
        lastBackupAt: priorState.lastBackupAt,
        lastFile: priorState.lastFile,
      });
    }

    const payload = {
      meta: {
        app: "ProjectBlackVault",
        formatVersion: 1,
        generatedAt: new Date().toISOString(),
        includeDocumentFiles,
        automated: true,
      },
      data,
    };

    const encrypted = encryptForServerBackup(payload, autoPassphrase);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `auto-backup-${stamp}.bvault`;
    const filePath = path.join(backupDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(encrypted, null, 2), "utf8");

    const nextState: AutoBackupState = {
      lastToken: token,
      lastBackupAt: new Date().toISOString(),
      lastFile: fileName,
    };

    await fs.writeFile(statePath, JSON.stringify(nextState, null, 2), "utf8");

    return NextResponse.json({
      ok: true,
      created: true,
      fileName,
      backupDir: "backups",
      token,
    });
  } catch (error) {
    if (error instanceof Error && (error as { status?: number }).status) return validationErrorResponse(error);
    console.error("POST /api/backup/auto error:", error);
    return NextResponse.json({ error: "Failed to run automatic backup" }, { status: 500 });
  }
}
