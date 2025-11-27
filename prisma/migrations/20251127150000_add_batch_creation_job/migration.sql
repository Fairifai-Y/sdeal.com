-- CreateTable
CREATE TABLE "BatchCreationJob" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "totalRecipients" INTEGER NOT NULL,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "batchesCreated" INTEGER NOT NULL DEFAULT 0,
    "currentChunk" INTEGER NOT NULL DEFAULT 0,
    "recipientIds" JSONB NOT NULL,
    "templateData" JSONB NOT NULL,
    "campaignData" JSONB NOT NULL,
    "chunkSize" INTEGER NOT NULL DEFAULT 500,
    "batchSize" INTEGER NOT NULL DEFAULT 100,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextProcessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchCreationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchCreationJob_campaignId_idx" ON "BatchCreationJob"("campaignId");

-- CreateIndex
CREATE INDEX "BatchCreationJob_status_idx" ON "BatchCreationJob"("status");

-- CreateIndex
CREATE INDEX "BatchCreationJob_nextProcessAt_idx" ON "BatchCreationJob"("nextProcessAt");

-- CreateIndex
CREATE INDEX "BatchCreationJob_createdAt_idx" ON "BatchCreationJob"("createdAt");

-- AddForeignKey
ALTER TABLE "BatchCreationJob" ADD CONSTRAINT "BatchCreationJob_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

