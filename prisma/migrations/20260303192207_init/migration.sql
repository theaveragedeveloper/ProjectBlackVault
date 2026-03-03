-- CreateTable
CREATE TABLE "Firearm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "caliber" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "acquisitionDate" DATETIME NOT NULL,
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
    "isActive" BOOLEAN NOT NULL DEFAULT false,
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
    "manufacturer" TEXT NOT NULL,
    "model" TEXT,
    "type" TEXT NOT NULL,
    "caliber" TEXT,
    "purchasePrice" REAL,
    "acquisitionDate" DATETIME,
    "notes" TEXT,
    "imageUrl" TEXT,
    "imageSource" TEXT,
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
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "googleCseApiKey" TEXT,
    "googleCseSearchEngineId" TEXT,
    "enableImageSearch" BOOLEAN NOT NULL DEFAULT false,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "appPassword" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Firearm_serialNumber_key" ON "Firearm"("serialNumber");

-- CreateIndex
CREATE INDEX "Firearm_caliber_idx" ON "Firearm"("caliber");

-- CreateIndex
CREATE INDEX "Firearm_type_idx" ON "Firearm"("type");

-- CreateIndex
CREATE INDEX "Build_firearmId_idx" ON "Build"("firearmId");

-- CreateIndex
CREATE INDEX "Build_isActive_idx" ON "Build"("isActive");

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
CREATE INDEX "RoundCountLog_accessoryId_idx" ON "RoundCountLog"("accessoryId");

-- CreateIndex
CREATE INDEX "RoundCountLog_loggedAt_idx" ON "RoundCountLog"("loggedAt");

-- CreateIndex
CREATE INDEX "AmmoStock_caliber_idx" ON "AmmoStock"("caliber");

-- CreateIndex
CREATE INDEX "AmmoTransaction_stockId_idx" ON "AmmoTransaction"("stockId");

-- CreateIndex
CREATE INDEX "AmmoTransaction_transactedAt_idx" ON "AmmoTransaction"("transactedAt");

-- CreateIndex
CREATE INDEX "ImageCache_entityType_entityId_idx" ON "ImageCache"("entityType", "entityId");
