-- Customer audit / onboarding changes, 2026-10-08.
-- Verify the target database and its schema before applying. Additive only; no data deletion.

-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS     "addressOnboardingDeferredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS     "requiresQualityApproval" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UploadedFile" ADD COLUMN IF NOT EXISTS     "lineItemIndex" INTEGER;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerOnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerOnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerOnboardingProgress_userId_companyId_key" ON "CustomerOnboardingProgress"("userId", "companyId");


-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerSupportRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "followUp" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "emailDelivery" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerSupportRequest_companyId_requestId_idx" ON "CustomerSupportRequest"("companyId", "requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerSupportRequest_status_createdAt_idx" ON "CustomerSupportRequest"("status", "createdAt");


-- AlterTable
ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS     "qualityApprovedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "qualityApprovedBy" TEXT;

-- AlterTable
ALTER TABLE "SupplierDocument" ADD COLUMN IF NOT EXISTS     "storageKey" TEXT;


-- AlterTable
ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS     "checkoutDetails" JSONB,
ADD COLUMN IF NOT EXISTS     "complianceReviewRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS     "complianceReviewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerRequestDraft" (
    "id" TEXT NOT NULL,
    "ownerScope" TEXT NOT NULL,
    "contents" JSONB NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerRequestDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerRequestDraft_ownerScope_editedAt_idx" ON "CustomerRequestDraft"("ownerScope", "editedAt");


-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS     "orderInvoiceKey" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerEmailEvent" (
    "key" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "CustomerEmailEvent_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerEmailEvent_status_createdAt_idx" ON "CustomerEmailEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_orderInvoiceKey_key" ON "Invoice"("orderInvoiceKey");
