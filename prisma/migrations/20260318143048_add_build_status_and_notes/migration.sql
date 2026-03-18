-- AlterTable
ALTER TABLE "Build" ADD COLUMN "imageSource" TEXT;
ALTER TABLE "Build" ADD COLUMN "imageUrl" TEXT;

-- CreateIndex
CREATE INDEX "Build_isActive_updatedAt_idx" ON "Build"("isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "Build_firearmId_isActive_updatedAt_idx" ON "Build"("firearmId", "isActive", "updatedAt");
