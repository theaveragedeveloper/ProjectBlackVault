-- AlterTable
ALTER TABLE "Accessory" ADD COLUMN "batteryReplacementIntervalDays" INTEGER;
ALTER TABLE "Accessory" ADD COLUMN "lastBatteryChangeDate" DATETIME;
ALTER TABLE "Accessory" ADD COLUMN "batteryNotes" TEXT;
