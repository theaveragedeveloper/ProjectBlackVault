-- CreateTable
CREATE TABLE "RangeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionDate" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "firearmId" TEXT NOT NULL,
    "buildId" TEXT,
    "roundsFired" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RangeSession_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RangeSession_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RangeSessionAmmoLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rangeSessionId" TEXT NOT NULL,
    "ammoStockId" TEXT NOT NULL,
    "roundsUsed" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RangeSessionAmmoLink_rangeSessionId_fkey" FOREIGN KEY ("rangeSessionId") REFERENCES "RangeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RangeSessionAmmoLink_ammoStockId_fkey" FOREIGN KEY ("ammoStockId") REFERENCES "AmmoStock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionDrill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rangeSessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeSeconds" REAL NOT NULL,
    "points" REAL NOT NULL,
    "penalties" REAL,
    "hits" INTEGER,
    "hitFactor" REAL NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionDrill_rangeSessionId_fkey" FOREIGN KEY ("rangeSessionId") REFERENCES "RangeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RangeSession_sessionDate_idx" ON "RangeSession"("sessionDate");

-- CreateIndex
CREATE INDEX "RangeSession_firearmId_idx" ON "RangeSession"("firearmId");

-- CreateIndex
CREATE INDEX "RangeSession_buildId_idx" ON "RangeSession"("buildId");

-- CreateIndex
CREATE INDEX "RangeSessionAmmoLink_rangeSessionId_idx" ON "RangeSessionAmmoLink"("rangeSessionId");

-- CreateIndex
CREATE INDEX "RangeSessionAmmoLink_ammoStockId_idx" ON "RangeSessionAmmoLink"("ammoStockId");

-- CreateIndex
CREATE UNIQUE INDEX "RangeSessionAmmoLink_rangeSessionId_ammoStockId_key" ON "RangeSessionAmmoLink"("rangeSessionId", "ammoStockId");

-- CreateIndex
CREATE INDEX "SessionDrill_rangeSessionId_idx" ON "SessionDrill"("rangeSessionId");
