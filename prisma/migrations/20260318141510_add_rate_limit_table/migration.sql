/*
  Warnings:

  - You are about to drop the column `passwordIsHashed` on the `AppSettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "googleCseApiKey" TEXT,
    "googleCseSearchEngineId" TEXT,
    "enableImageSearch" BOOLEAN NOT NULL DEFAULT false,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "appPassword" TEXT,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "encryptionKey" TEXT,
    "dataStoragePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("appPassword", "createdAt", "defaultCurrency", "enableImageSearch", "googleCseApiKey", "googleCseSearchEngineId", "id", "updatedAt") SELECT "appPassword", "createdAt", "defaultCurrency", "enableImageSearch", "googleCseApiKey", "googleCseSearchEngineId", "id", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
