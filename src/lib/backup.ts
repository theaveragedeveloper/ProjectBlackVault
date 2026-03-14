import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

async function readDocumentFileAsBase64(fileUrl: string): Promise<string | null> {
  let absolutePath: string | null = null;

  if (fileUrl.startsWith("/api/files/documents/")) {
    const fileName = fileUrl.replace("/api/files/documents/", "").split("?")[0];
    absolutePath = path.join(process.cwd(), "storage", "uploads", "documents", fileName);
  } else if (fileUrl.startsWith("/uploads/")) {
    absolutePath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  }

  if (!absolutePath) return null;

  try {
    const buf = await fs.readFile(absolutePath);
    return buf.toString("base64");
  } catch {
    return null;
  }
}

export async function collectBackupData(includeDocumentFiles: boolean) {
  const [
    settings,
    firearms,
    accessories,
    builds,
    buildSlots,
    maintenanceNotes,
    maintenanceSchedules,
    rangeSessions,
    drillTemplates,
    sessionDrills,
    drillLogs,
    ammo,
    ammoTransactions,
    documents,
  ] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: "singleton" } }),
    prisma.firearm.findMany(),
    prisma.accessory.findMany(),
    prisma.build.findMany(),
    prisma.buildSlot.findMany(),
    prisma.maintenanceNote.findMany(),
    prisma.maintenanceSchedule.findMany(),
    prisma.rangeSession.findMany(),
    prisma.drillTemplate.findMany(),
    prisma.sessionDrill.findMany(),
    prisma.drillLog.findMany(),
    prisma.ammoStock.findMany(),
    prisma.ammoTransaction.findMany(),
    prisma.document.findMany(),
  ]);

  const documentFiles = includeDocumentFiles
    ? await Promise.all(
        documents.map(async (doc) => ({
          documentId: doc.id,
          fileUrl: doc.fileUrl,
          mimeType: doc.mimeType,
          contentBase64: await readDocumentFileAsBase64(doc.fileUrl),
        }))
      )
    : [];

  return {
    settings,
    firearms,
    accessories,
    builds,
    buildSlots,
    maintenanceNotes,
    maintenanceSchedules,
    rangeSessions,
    drillTemplates,
    sessionDrills,
    drillLogs,
    ammo,
    ammoTransactions,
    documents,
    documentFiles,
  };
}

export function latestBackupChangeToken(data: Awaited<ReturnType<typeof collectBackupData>>): number {
  const allDates: number[] = [];

  const pushDates = <T extends { updatedAt?: Date | null }>(items: T[]) => {
    for (const item of items) {
      if (item.updatedAt) allDates.push(item.updatedAt.getTime());
    }
  };

  if (data.settings?.updatedAt) allDates.push(data.settings.updatedAt.getTime());
  pushDates(data.firearms);
  pushDates(data.accessories);
  pushDates(data.builds);
  pushDates(data.maintenanceNotes);
  pushDates(data.maintenanceSchedules);
  pushDates(data.rangeSessions);
  pushDates(data.drillTemplates);
  pushDates(data.drillLogs);
  pushDates(data.ammo);
  pushDates(data.documents);

  return allDates.length ? Math.max(...allDates) : 0;
}
