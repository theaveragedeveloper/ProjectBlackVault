-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RangeSessionAmmoLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rangeSessionId" TEXT NOT NULL,
    "ammoStockId" TEXT,
    "roundsUsed" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RangeSessionAmmoLink_rangeSessionId_fkey" FOREIGN KEY ("rangeSessionId") REFERENCES "RangeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RangeSessionAmmoLink_ammoStockId_fkey" FOREIGN KEY ("ammoStockId") REFERENCES "AmmoStock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RangeSessionAmmoLink" ("ammoStockId", "createdAt", "id", "rangeSessionId", "roundsUsed") SELECT "ammoStockId", "createdAt", "id", "rangeSessionId", "roundsUsed" FROM "RangeSessionAmmoLink";
DROP TABLE "RangeSessionAmmoLink";
ALTER TABLE "new_RangeSessionAmmoLink" RENAME TO "RangeSessionAmmoLink";
CREATE INDEX "RangeSessionAmmoLink_rangeSessionId_idx" ON "RangeSessionAmmoLink"("rangeSessionId");
CREATE INDEX "RangeSessionAmmoLink_ammoStockId_idx" ON "RangeSessionAmmoLink"("ammoStockId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
