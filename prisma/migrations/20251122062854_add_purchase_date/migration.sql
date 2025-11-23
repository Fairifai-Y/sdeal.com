/*
  Warnings:

  - A unique constraint covering the columns `[email,purchaseDate]` on the table `Consumer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Consumer_email_key";

-- AlterTable
ALTER TABLE "Consumer" ADD COLUMN     "purchaseDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SyncStatus" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "lastEntityId" INTEGER,
    "lastSyncAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'stopped',
    "totalProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalCreated" INTEGER NOT NULL DEFAULT 0,
    "totalErrors" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncStatus_lastSyncAt_idx" ON "SyncStatus"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_syncType_key" ON "SyncStatus"("syncType");

-- CreateIndex
CREATE INDEX "Consumer_purchaseDate_idx" ON "Consumer"("purchaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Consumer_email_purchaseDate_key" ON "Consumer"("email", "purchaseDate");
