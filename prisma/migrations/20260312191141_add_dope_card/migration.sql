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

-- CreateIndex
CREATE INDEX "DopeCard_firearmId_idx" ON "DopeCard"("firearmId");

-- CreateIndex
CREATE INDEX "DopeCard_updatedAt_idx" ON "DopeCard"("updatedAt");
