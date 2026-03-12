/*
  Warnings:

  - You are about to drop the column `buildId` on the `RangeSession` table. All the data in the column will be lost.
  - You are about to drop the column `firearmId` on the `RangeSession` table. All the data in the column will be lost.
  - You are about to drop the column `roundsFired` on the `RangeSession` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "RangeSessionFirearm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "firearmId" TEXT NOT NULL,
    "roundsFired" INTEGER NOT NULL,
    "buildId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RangeSessionFirearm_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RangeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RangeSessionFirearm_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RangeSessionFirearm_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);


-- Backfill join rows from legacy RangeSession firearm fields
INSERT INTO "RangeSessionFirearm" ("id", "sessionId", "firearmId", "roundsFired", "buildId", "createdAt", "updatedAt")
SELECT
    lower(hex(randomblob(12))),
    "id",
    "firearmId",
    "roundsFired",
    "buildId",
    "createdAt",
    "updatedAt"
FROM "RangeSession";

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
CREATE INDEX "RangeSessionFirearm_sessionId_idx" ON "RangeSessionFirearm"("sessionId");

-- CreateIndex
CREATE INDEX "RangeSessionFirearm_firearmId_idx" ON "RangeSessionFirearm"("firearmId");

-- CreateIndex
CREATE INDEX "RangeSessionFirearm_buildId_idx" ON "RangeSessionFirearm"("buildId");

-- CreateIndex
CREATE UNIQUE INDEX "RangeSessionFirearm_sessionId_firearmId_key" ON "RangeSessionFirearm"("sessionId", "firearmId");
