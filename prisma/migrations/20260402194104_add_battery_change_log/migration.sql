-- CreateTable
CREATE TABLE "BatteryChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessoryId" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batteryType" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BatteryChangeLog_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES "Accessory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BatteryChangeLog_accessoryId_idx" ON "BatteryChangeLog"("accessoryId");

-- CreateIndex
CREATE INDEX "BatteryChangeLog_changedAt_idx" ON "BatteryChangeLog"("changedAt");
