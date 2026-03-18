-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "dataStoragePath" TEXT;

-- CreateTable
CREATE TABLE "RangeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "buildId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundsFired" INTEGER NOT NULL,
    "rangeName" TEXT,
    "rangeLocation" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RangeSession_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RangeSession_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'other',
    "description" TEXT NOT NULL,
    "mileage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceNote_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE TABLE "new_Firearm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "caliber" TEXT NOT NULL DEFAULT '',
    "serialNumber" TEXT,
    "type" TEXT NOT NULL DEFAULT '',
    "acquisitionDate" DATETIME,
    "purchasePrice" REAL,
    "currentValue" REAL,
    "notes" TEXT,
    "imageUrl" TEXT,
    "imageSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Firearm" ("acquisitionDate", "caliber", "createdAt", "currentValue", "id", "imageSource", "imageUrl", "manufacturer", "model", "name", "notes", "purchasePrice", "serialNumber", "type", "updatedAt") SELECT "acquisitionDate", "caliber", "createdAt", "currentValue", "id", "imageSource", "imageUrl", "manufacturer", "model", "name", "notes", "purchasePrice", "serialNumber", "type", "updatedAt" FROM "Firearm";
DROP TABLE "Firearm";
ALTER TABLE "new_Firearm" RENAME TO "Firearm";
CREATE UNIQUE INDEX "Firearm_serialNumber_key" ON "Firearm"("serialNumber");
CREATE INDEX "Firearm_caliber_idx" ON "Firearm"("caliber");
CREATE INDEX "Firearm_type_idx" ON "Firearm"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RangeSession_firearmId_idx" ON "RangeSession"("firearmId");

-- CreateIndex
CREATE INDEX "RangeSession_date_idx" ON "RangeSession"("date");

-- CreateIndex
CREATE INDEX "MaintenanceNote_firearmId_idx" ON "MaintenanceNote"("firearmId");

-- CreateIndex
CREATE INDEX "MaintenanceNote_date_idx" ON "MaintenanceNote"("date");
