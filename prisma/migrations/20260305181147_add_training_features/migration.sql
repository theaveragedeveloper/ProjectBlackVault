-- AlterTable
ALTER TABLE "RangeSession" ADD COLUMN "environment" TEXT;
ALTER TABLE "RangeSession" ADD COLUMN "groupNotes" TEXT;
ALTER TABLE "RangeSession" ADD COLUMN "groupSizeIn" REAL;
ALTER TABLE "RangeSession" ADD COLUMN "groupSizeMoa" REAL;
ALTER TABLE "RangeSession" ADD COLUMN "humidity" REAL;
ALTER TABLE "RangeSession" ADD COLUMN "lightCondition" TEXT;
ALTER TABLE "RangeSession" ADD COLUMN "numberOfGroups" INTEGER;
ALTER TABLE "RangeSession" ADD COLUMN "targetDistanceYd" REAL;
ALTER TABLE "RangeSession" ADD COLUMN "temperatureF" REAL;
ALTER TABLE "RangeSession" ADD COLUMN "weatherNotes" TEXT;
ALTER TABLE "RangeSession" ADD COLUMN "windDirection" TEXT;
ALTER TABLE "RangeSession" ADD COLUMN "windSpeedMph" REAL;

-- CreateTable
CREATE TABLE "DrillTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'CUSTOM',
    "scoringType" TEXT NOT NULL DEFAULT 'NOTES_ONLY',
    "parTime" REAL,
    "maxScore" INTEGER,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SessionDrill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "templateId" TEXT,
    "drillName" TEXT NOT NULL,
    "timeSeconds" REAL,
    "hits" INTEGER,
    "totalShots" INTEGER,
    "accuracy" REAL,
    "score" REAL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionDrill_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RangeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionDrill_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DrillTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionAmmoLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    CONSTRAINT "SessionAmmoLink_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RangeSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionAmmoLink_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "AmmoTransaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DrillTemplate_category_idx" ON "DrillTemplate"("category");

-- CreateIndex
CREATE INDEX "SessionDrill_sessionId_idx" ON "SessionDrill"("sessionId");

-- CreateIndex
CREATE INDEX "SessionDrill_templateId_idx" ON "SessionDrill"("templateId");

-- CreateIndex
CREATE INDEX "SessionAmmoLink_sessionId_idx" ON "SessionAmmoLink"("sessionId");

-- CreateIndex
CREATE INDEX "SessionAmmoLink_transactionId_idx" ON "SessionAmmoLink"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAmmoLink_sessionId_transactionId_key" ON "SessionAmmoLink"("sessionId", "transactionId");
