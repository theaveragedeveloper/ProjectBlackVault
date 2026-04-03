-- AlterTable
ALTER TABLE "Build" ADD COLUMN "roundCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BuildRoundCountLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buildId" TEXT NOT NULL,
    "roundsAdded" INTEGER NOT NULL,
    "previousCount" INTEGER NOT NULL,
    "newCount" INTEGER NOT NULL,
    "sessionNote" TEXT,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BuildRoundCountLog_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BuildRoundCountLog_buildId_idx" ON "BuildRoundCountLog"("buildId");

-- CreateIndex
CREATE INDEX "BuildRoundCountLog_loggedAt_idx" ON "BuildRoundCountLog"("loggedAt");
