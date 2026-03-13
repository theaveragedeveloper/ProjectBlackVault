-- CreateTable
CREATE TABLE "ApiRateLimit" (
    "bucketId" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "windowStart" DATETIME NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "ApiRateLimit_key_windowStart_idx" ON "ApiRateLimit"("key", "windowStart");
