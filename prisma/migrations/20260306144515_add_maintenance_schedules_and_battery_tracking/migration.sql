-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "intervalType" TEXT NOT NULL,
    "intervalValue" INTEGER NOT NULL,
    "lastCompletedAt" DATETIME,
    "lastRoundCount" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceSchedule_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundCountAtCompletion" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceCompletion_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MaintenanceSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Accessory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "model" TEXT,
    "type" TEXT NOT NULL,
    "caliber" TEXT,
    "purchasePrice" REAL,
    "acquisitionDate" DATETIME,
    "notes" TEXT,
    "imageUrl" TEXT,
    "imageSource" TEXT,
    "roundCount" INTEGER NOT NULL DEFAULT 0,
    "hasBattery" BOOLEAN NOT NULL DEFAULT false,
    "batteryType" TEXT,
    "batteryChangedAt" DATETIME,
    "batteryIntervalDays" INTEGER,
    "compatibleFirearmTypes" TEXT,
    "compatibleCalibers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Accessory" ("acquisitionDate", "caliber", "compatibleCalibers", "compatibleFirearmTypes", "createdAt", "id", "imageSource", "imageUrl", "manufacturer", "model", "name", "notes", "purchasePrice", "roundCount", "type", "updatedAt") SELECT "acquisitionDate", "caliber", "compatibleCalibers", "compatibleFirearmTypes", "createdAt", "id", "imageSource", "imageUrl", "manufacturer", "model", "name", "notes", "purchasePrice", "roundCount", "type", "updatedAt" FROM "Accessory";
DROP TABLE "Accessory";
ALTER TABLE "new_Accessory" RENAME TO "Accessory";
CREATE INDEX "Accessory_type_idx" ON "Accessory"("type");
CREATE INDEX "Accessory_roundCount_idx" ON "Accessory"("roundCount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_firearmId_idx" ON "MaintenanceSchedule"("firearmId");

-- CreateIndex
CREATE INDEX "MaintenanceCompletion_scheduleId_idx" ON "MaintenanceCompletion"("scheduleId");
