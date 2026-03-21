ALTER TABLE "MaintenanceNote" ADD COLUMN "dueDate" DATETIME;

CREATE INDEX "MaintenanceNote_dueDate_idx" ON "MaintenanceNote"("dueDate");
