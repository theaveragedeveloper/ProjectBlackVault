/*
  Warnings:

  - You are about to drop the column `buildId` on the `RangeSession` table. All the data in the column will be lost.
  - You are about to drop the column `firearmId` on the `RangeSession` table. All the data in the column will be lost.
  - You are about to drop the column `roundsFired` on the `RangeSession` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SessionFirearm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "firearmId" TEXT NOT NULL,
    "buildId" TEXT,
    "roundsFired" INTEGER NOT NULL,
    CONSTRAINT "SessionFirearm_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RangeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionFirearm_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionFirearm_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DopeCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "buildId" TEXT,
    "ammoStockId" TEXT,
    "name" TEXT NOT NULL,
    "zeroDistanceYd" REAL NOT NULL,
    "sightHeightIn" REAL,
    "unit" TEXT NOT NULL,
    "temperatureF" REAL,
    "pressureInHg" REAL,
    "densityAltitudeFt" REAL,
    "notes" TEXT,
    "rows" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DopeCard_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DopeCard_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DopeCard_ammoStockId_fkey" FOREIGN KEY ("ammoStockId") REFERENCES "AmmoStock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiRateLimit" (
    "bucketId" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "windowStart" DATETIME NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RangeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rangeName" TEXT,
    "rangeLocation" TEXT,
    "notes" TEXT,
    "environment" TEXT,
    "temperatureF" REAL,
    "windSpeedMph" REAL,
    "windDirection" TEXT,
    "humidity" REAL,
    "lightCondition" TEXT,
    "weatherNotes" TEXT,
    "targetDistanceYd" REAL,
    "groupSizeIn" REAL,
    "groupSizeMoa" REAL,
    "numberOfGroups" INTEGER,
    "groupNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_RangeSession" ("createdAt", "date", "environment", "groupNotes", "groupSizeIn", "groupSizeMoa", "humidity", "id", "lightCondition", "notes", "numberOfGroups", "rangeLocation", "rangeName", "targetDistanceYd", "temperatureF", "updatedAt", "weatherNotes", "windDirection", "windSpeedMph") SELECT "createdAt", "date", "environment", "groupNotes", "groupSizeIn", "groupSizeMoa", "humidity", "id", "lightCondition", "notes", "numberOfGroups", "rangeLocation", "rangeName", "targetDistanceYd", "temperatureF", "updatedAt", "weatherNotes", "windDirection", "windSpeedMph" FROM "RangeSession";
DROP TABLE "RangeSession";
ALTER TABLE "new_RangeSession" RENAME TO "RangeSession";
CREATE INDEX "RangeSession_date_idx" ON "RangeSession"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SessionFirearm_sessionId_idx" ON "SessionFirearm"("sessionId");

-- CreateIndex
CREATE INDEX "SessionFirearm_firearmId_idx" ON "SessionFirearm"("firearmId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionFirearm_sessionId_firearmId_buildId_key" ON "SessionFirearm"("sessionId", "firearmId", "buildId");

-- CreateIndex
CREATE INDEX "DopeCard_firearmId_idx" ON "DopeCard"("firearmId");

-- CreateIndex
CREATE INDEX "DopeCard_updatedAt_idx" ON "DopeCard"("updatedAt");

-- CreateIndex
CREATE INDEX "ApiRateLimit_key_windowStart_idx" ON "ApiRateLimit"("key", "windowStart");
