-- AlterTable
ALTER TABLE "Accessory" ADD COLUMN "hasBattery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Accessory" ADD COLUMN "batteryType" TEXT;
ALTER TABLE "Accessory" ADD COLUMN "batteryReplacementIntervalDays" INTEGER;
ALTER TABLE "Accessory" ADD COLUMN "lastBatteryChangeDate" DATETIME;
ALTER TABLE "Accessory" ADD COLUMN "batteryNotes" TEXT;
