-- CreateTable
CREATE TABLE "Firearm" (
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

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "imageSource" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "notes" TEXT,
    "firearmId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Build_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuildSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildId" TEXT NOT NULL,
    "slotType" TEXT NOT NULL,
    "accessoryId" TEXT,
    "positionX" REAL,
    "positionY" REAL,
    "scaleX" REAL DEFAULT 1.0,
    "scaleY" REAL DEFAULT 1.0,
    "layerIndex" INTEGER DEFAULT 0,
    CONSTRAINT "BuildSlot_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuildSlot_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "Accessory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Accessory" (
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
    "hasBattery" BOOLEAN NOT NULL DEFAULT false,
    "batteryType" TEXT,
    "batteryReplacementIntervalDays" INTEGER,
    "lastBatteryChangeDate" DATETIME,
    "batteryNotes" TEXT,
    "roundCount" INTEGER NOT NULL DEFAULT 0,
    "compatibleFirearmTypes" TEXT,
    "compatibleCalibers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoundCountLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessoryId" TEXT NOT NULL,
    "roundsAdded" INTEGER NOT NULL,
    "previousCount" INTEGER NOT NULL,
    "newCount" INTEGER NOT NULL,
    "sessionNote" TEXT,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoundCountLog_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "Accessory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RangeSession" (
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

-- CreateTable
CREATE TABLE "MaintenanceNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "type" TEXT NOT NULL DEFAULT 'other',
    "description" TEXT NOT NULL,
    "mileage" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceNote_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "intervalType" TEXT NOT NULL,
    "intervalValue" INTEGER NOT NULL,
    "lastCompletedAt" DATETIME,
    "lastRoundCount" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceSchedule_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundCountAtCompletion" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceCompletion_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "MaintenanceSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AmmoStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caliber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "grainWeight" REAL,
    "bulletType" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" REAL,
    "purchaseDate" DATETIME,
    "storageLocation" TEXT,
    "lowStockAlert" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AmmoTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousQty" INTEGER NOT NULL,
    "newQty" INTEGER NOT NULL,
    "note" TEXT,
    "transactedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AmmoTransaction_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "AmmoStock" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ImageCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- CreateTable
CREATE TABLE "AppSettings" (
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

-- CreateTable
CREATE TABLE "ApiRateLimit" (
    "bucketId" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "windowStart" DATETIME NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "Firearm_serialNumber_key" ON "Firearm"("serialNumber");

-- CreateIndex
CREATE INDEX "Firearm_caliber_idx" ON "Firearm"("caliber");

-- CreateIndex
CREATE INDEX "Firearm_type_idx" ON "Firearm"("type");

-- CreateIndex
CREATE INDEX "Firearm_createdAt_idx" ON "Firearm"("createdAt");

-- CreateIndex
CREATE INDEX "Build_firearmId_idx" ON "Build"("firearmId");

-- CreateIndex
CREATE INDEX "Build_isActive_idx" ON "Build"("isActive");

-- CreateIndex
CREATE INDEX "Build_status_idx" ON "Build"("status");

-- CreateIndex
CREATE INDEX "Build_isActive_updatedAt_idx" ON "Build"("isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "Build_firearmId_isActive_updatedAt_idx" ON "Build"("firearmId", "isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "BuildSlot_buildId_idx" ON "BuildSlot"("buildId");

-- CreateIndex
CREATE INDEX "BuildSlot_accessoryId_idx" ON "BuildSlot"("accessoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BuildSlot_buildId_slotType_key" ON "BuildSlot"("buildId", "slotType");

-- CreateIndex
CREATE INDEX "Accessory_type_idx" ON "Accessory"("type");

-- CreateIndex
CREATE INDEX "Accessory_roundCount_idx" ON "Accessory"("roundCount");

-- CreateIndex
CREATE INDEX "Accessory_createdAt_idx" ON "Accessory"("createdAt");

-- CreateIndex
CREATE INDEX "Accessory_type_createdAt_idx" ON "Accessory"("type", "createdAt");

-- CreateIndex
CREATE INDEX "RoundCountLog_accessoryId_idx" ON "RoundCountLog"("accessoryId");

-- CreateIndex
CREATE INDEX "RoundCountLog_loggedAt_idx" ON "RoundCountLog"("loggedAt");

-- CreateIndex
CREATE INDEX "RangeSession_date_idx" ON "RangeSession"("date");

-- CreateIndex
CREATE INDEX "SessionFirearm_sessionId_idx" ON "SessionFirearm"("sessionId");

-- CreateIndex
CREATE INDEX "SessionFirearm_firearmId_idx" ON "SessionFirearm"("firearmId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionFirearm_sessionId_firearmId_buildId_key" ON "SessionFirearm"("sessionId", "firearmId", "buildId");

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

-- CreateIndex
CREATE INDEX "MaintenanceNote_firearmId_idx" ON "MaintenanceNote"("firearmId");

-- CreateIndex
CREATE INDEX "MaintenanceNote_date_idx" ON "MaintenanceNote"("date");

-- CreateIndex
CREATE INDEX "MaintenanceNote_dueDate_idx" ON "MaintenanceNote"("dueDate");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_firearmId_idx" ON "MaintenanceSchedule"("firearmId");

-- CreateIndex
CREATE INDEX "MaintenanceCompletion_scheduleId_idx" ON "MaintenanceCompletion"("scheduleId");

-- CreateIndex
CREATE INDEX "AmmoStock_caliber_idx" ON "AmmoStock"("caliber");

-- CreateIndex
CREATE INDEX "AmmoTransaction_stockId_idx" ON "AmmoTransaction"("stockId");

-- CreateIndex
CREATE INDEX "AmmoTransaction_transactedAt_idx" ON "AmmoTransaction"("transactedAt");

-- CreateIndex
CREATE INDEX "DopeCard_firearmId_idx" ON "DopeCard"("firearmId");

-- CreateIndex
CREATE INDEX "DopeCard_updatedAt_idx" ON "DopeCard"("updatedAt");

-- CreateIndex
CREATE INDEX "Photo_entityType_entityId_idx" ON "Photo"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ImageCache_entityType_entityId_idx" ON "ImageCache"("entityType", "entityId");

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

-- CreateIndex
CREATE INDEX "ApiRateLimit_key_windowStart_idx" ON "ApiRateLimit"("key", "windowStart");
