-- CreateTable
CREATE TABLE "Consumer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "country" TEXT,
    "isUnsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribedAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "lastEmailOpenedAt" TIMESTAMP(3),
    "lastEmailClickedAt" TIMESTAMP(3),
    "totalEmailsSent" INTEGER NOT NULL DEFAULT 0,
    "totalEmailsOpened" INTEGER NOT NULL DEFAULT 0,
    "totalEmailsClicked" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "sourceUrl" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consumer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "consumerId" TEXT,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalUnsubscribed" INTEGER NOT NULL DEFAULT 0,
    "filterCriteria" JSONB,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "bounceType" TEXT,
    "bounceReason" TEXT,
    "eventData" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "availableVariables" JSONB,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailWorkflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailWorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "delayHours" INTEGER NOT NULL DEFAULT 0,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailWorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailWorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "nextStepAt" TIMESTAMP(3),
    "executionData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailWorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Consumer_email_key" ON "Consumer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Consumer_unsubscribeToken_key" ON "Consumer"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "Consumer_email_idx" ON "Consumer"("email");

-- CreateIndex
CREATE INDEX "Consumer_store_idx" ON "Consumer"("store");

-- CreateIndex
CREATE INDEX "Consumer_country_idx" ON "Consumer"("country");

-- CreateIndex
CREATE INDEX "Consumer_isUnsubscribed_idx" ON "Consumer"("isUnsubscribed");

-- CreateIndex
CREATE INDEX "Consumer_lastContactAt_idx" ON "Consumer"("lastContactAt");

-- CreateIndex
CREATE INDEX "Consumer_createdAt_idx" ON "Consumer"("createdAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_idx" ON "EmailCampaign"("status");

-- CreateIndex
CREATE INDEX "EmailCampaign_scheduledAt_idx" ON "EmailCampaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_sentAt_idx" ON "EmailCampaign"("sentAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_consumerId_idx" ON "EmailCampaign"("consumerId");

-- CreateIndex
CREATE INDEX "EmailCampaign_createdAt_idx" ON "EmailCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "EmailEvent_campaignId_idx" ON "EmailEvent"("campaignId");

-- CreateIndex
CREATE INDEX "EmailEvent_consumerId_idx" ON "EmailEvent"("consumerId");

-- CreateIndex
CREATE INDEX "EmailEvent_eventType_idx" ON "EmailEvent"("eventType");

-- CreateIndex
CREATE INDEX "EmailEvent_bounceType_idx" ON "EmailEvent"("bounceType");

-- CreateIndex
CREATE INDEX "EmailEvent_occurredAt_idx" ON "EmailEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailTemplate_isActive_idx" ON "EmailTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailTemplate_createdAt_idx" ON "EmailTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "EmailWorkflow_triggerType_idx" ON "EmailWorkflow"("triggerType");

-- CreateIndex
CREATE INDEX "EmailWorkflow_isActive_idx" ON "EmailWorkflow"("isActive");

-- CreateIndex
CREATE INDEX "EmailWorkflow_createdAt_idx" ON "EmailWorkflow"("createdAt");

-- CreateIndex
CREATE INDEX "EmailWorkflowStep_workflowId_idx" ON "EmailWorkflowStep"("workflowId");

-- CreateIndex
CREATE INDEX "EmailWorkflowStep_templateId_idx" ON "EmailWorkflowStep"("templateId");

-- CreateIndex
CREATE INDEX "EmailWorkflowStep_stepOrder_idx" ON "EmailWorkflowStep"("stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "EmailWorkflowStep_workflowId_stepOrder_key" ON "EmailWorkflowStep"("workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "EmailWorkflowExecution_workflowId_idx" ON "EmailWorkflowExecution"("workflowId");

-- CreateIndex
CREATE INDEX "EmailWorkflowExecution_consumerId_idx" ON "EmailWorkflowExecution"("consumerId");

-- CreateIndex
CREATE INDEX "EmailWorkflowExecution_status_idx" ON "EmailWorkflowExecution"("status");

-- CreateIndex
CREATE INDEX "EmailWorkflowExecution_nextStepAt_idx" ON "EmailWorkflowExecution"("nextStepAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailWorkflowExecution_workflowId_consumerId_key" ON "EmailWorkflowExecution"("workflowId", "consumerId");

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailWorkflowStep" ADD CONSTRAINT "EmailWorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "EmailWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailWorkflowStep" ADD CONSTRAINT "EmailWorkflowStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailWorkflowExecution" ADD CONSTRAINT "EmailWorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "EmailWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailWorkflowExecution" ADD CONSTRAINT "EmailWorkflowExecution_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
