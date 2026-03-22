-- AlterTable
ALTER TABLE "Firearm" ADD COLUMN "lastMaintenanceDate" DATETIME;
ALTER TABLE "Firearm" ADD COLUMN "maintenanceIntervalDays" INTEGER;

-- AlterTable
ALTER TABLE "Accessory" ADD COLUMN "hasBattery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Accessory" ADD COLUMN "batteryType" TEXT;
ALTER TABLE "Accessory" ADD COLUMN "lastBatteryChangeDate" DATETIME;
ALTER TABLE "Accessory" ADD COLUMN "replacementIntervalDays" INTEGER;
