import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";
import fs from "fs";
import path from "path";

export async function POST() {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    // Sequential queries — connection_limit=1 means Promise.all would deadlock
    const firearms             = await prisma.firearm.findMany({ orderBy: { createdAt: "asc" } });
    const builds               = await prisma.build.findMany({ orderBy: { createdAt: "asc" } });
    const buildSlots           = await prisma.buildSlot.findMany();
    const accessories          = await prisma.accessory.findMany({ orderBy: { createdAt: "asc" } });
    const documents            = await prisma.document.findMany({ orderBy: { createdAt: "asc" } });
    const roundCountLogs       = await prisma.roundCountLog.findMany({ orderBy: { loggedAt: "asc" } });
    const ammoStocks           = await prisma.ammoStock.findMany({ orderBy: { createdAt: "asc" } });
    const ammoTransactions     = await prisma.ammoTransaction.findMany({ orderBy: { transactedAt: "asc" } });
    const rangeSessions        = await prisma.rangeSession.findMany({ orderBy: { sessionDate: "asc" } });
    const rangeSessionAmmoLinks = await prisma.rangeSessionAmmoLink.findMany();
    const sessionDrills        = await prisma.sessionDrill.findMany({ orderBy: { createdAt: "asc" } });
    const imageCache           = await prisma.imageCache.findMany();
    const settings             = await prisma.appSettings.findUnique({ where: { id: "singleton" } });

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);

    const backupData = {
      firearms,
      builds,
      buildSlots,
      accessories,
      documents,
      roundCountLogs,
      ammoStocks,
      ammoTransactions,
      rangeSessions,
      rangeSessionAmmoLinks,
      sessionDrills,
      imageCache,
    };

    const meta = {
      version: "1.0",
      createdAt: now.toISOString(),
      includeUploads: settings?.includeUploadsInBackup ?? true,
      counts: Object.fromEntries(Object.entries(backupData).map(([k, v]) => [k, v.length])),
    };

    const payload = { meta, ...backupData };
    const json = JSON.stringify(payload, null, 2);
    const sizeMB = (Buffer.byteLength(json, "utf8") / 1_048_576).toFixed(2);

    const filename = `blackvault-backup-${timestamp}.json`;

    // Optional server-side save — non-fatal if it fails
    let savedToPath: string | undefined;
    if (settings?.backupDestinationPath) {
      try {
        const destDir = settings.backupDestinationPath;
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const fullPath = path.join(destDir, filename);
        fs.writeFileSync(fullPath, json, "utf8");
        savedToPath = fullPath;
      } catch (fsErr) {
        console.warn("Could not write backup to disk:", fsErr);
      }
    }

    return NextResponse.json({
      success: true,
      filename,
      meta,
      data: backupData,
      savedToPath,
      sizeMB,
    });
  } catch (error) {
    console.error("POST /api/backup error:", error);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}
