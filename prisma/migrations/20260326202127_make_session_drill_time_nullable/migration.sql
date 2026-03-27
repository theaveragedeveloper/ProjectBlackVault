-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SessionDrill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rangeSessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL DEFAULT 1,
    "timeSeconds" REAL,
    "points" REAL,
    "penalties" REAL,
    "hits" INTEGER,
    "hitFactor" REAL NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "drillDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionDrill_rangeSessionId_fkey" FOREIGN KEY ("rangeSessionId") REFERENCES "RangeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SessionDrill" ("createdAt", "drillDate", "hitFactor", "hits", "id", "name", "notes", "penalties", "points", "rangeSessionId", "setNumber", "sortOrder", "timeSeconds") SELECT "createdAt", "drillDate", "hitFactor", "hits", "id", "name", "notes", "penalties", "points", "rangeSessionId", "setNumber", "sortOrder", "timeSeconds" FROM "SessionDrill";
DROP TABLE "SessionDrill";
ALTER TABLE "new_SessionDrill" RENAME TO "SessionDrill";
CREATE INDEX "SessionDrill_rangeSessionId_idx" ON "SessionDrill"("rangeSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
