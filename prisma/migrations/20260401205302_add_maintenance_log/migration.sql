-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firearmId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT NOT NULL,
    "roundCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceLog_firearmId_fkey" FOREIGN KEY ("firearmId") REFERENCES "Firearm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MaintenanceLog_firearmId_idx" ON "MaintenanceLog"("firearmId");

-- CreateIndex
CREATE INDEX "MaintenanceLog_date_idx" ON "MaintenanceLog"("date");
