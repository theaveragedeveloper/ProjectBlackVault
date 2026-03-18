-- CreateTable
CREATE TABLE "DrillLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT,
    "drillName" TEXT NOT NULL,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSeconds" REAL,
    "hits" INTEGER,
    "totalShots" INTEGER,
    "accuracy" REAL,
    "score" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DrillLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DrillTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RECEIPT',
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "notes" TEXT,
    "firearmId" TEXT,
    "accessoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "Accessory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DrillLog_templateId_idx" ON "DrillLog"("templateId");

-- CreateIndex
CREATE INDEX "DrillLog_performedAt_idx" ON "DrillLog"("performedAt");

-- CreateIndex
CREATE INDEX "Document_firearmId_idx" ON "Document"("firearmId");

-- CreateIndex
CREATE INDEX "Document_accessoryId_idx" ON "Document"("accessoryId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");
