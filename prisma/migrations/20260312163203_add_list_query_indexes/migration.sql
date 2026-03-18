-- CreateIndex
CREATE INDEX "Accessory_createdAt_idx" ON "Accessory"("createdAt");

-- CreateIndex
CREATE INDEX "Accessory_type_createdAt_idx" ON "Accessory"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Build_isActive_updatedAt_idx" ON "Build"("isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "Build_firearmId_isActive_updatedAt_idx" ON "Build"("firearmId", "isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "Firearm_createdAt_idx" ON "Firearm"("createdAt");
