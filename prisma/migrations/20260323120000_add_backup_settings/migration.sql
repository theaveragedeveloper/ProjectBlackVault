-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "includeUploadsInBackup" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AppSettings" ADD COLUMN "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppSettings" ADD COLUMN "autoBackupCadence" TEXT NOT NULL DEFAULT 'weekly';
