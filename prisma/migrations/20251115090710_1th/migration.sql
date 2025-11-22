-- CreateTable
CREATE TABLE "PackageSelection" (
    "id" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "addonDealCSS" BOOLEAN NOT NULL DEFAULT false,
    "addonCAAS" BOOLEAN NOT NULL DEFAULT false,
    "addonFairifAI" BOOLEAN NOT NULL DEFAULT false,
    "agreementAccepted" BOOLEAN NOT NULL,
    "agreementVersion" TEXT NOT NULL DEFAULT 'SellerAgreement_7.0_2026-01',
    "termsVersion" TEXT NOT NULL DEFAULT 'SellerTerms_2026-01',
    "language" TEXT NOT NULL,
    "ipAddress" TEXT,
    "sellerEmail" TEXT,
    "sellerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackageSelection_package_idx" ON "PackageSelection"("package");

-- CreateIndex
CREATE INDEX "PackageSelection_createdAt_idx" ON "PackageSelection"("createdAt");

-- CreateIndex
CREATE INDEX "PackageSelection_language_idx" ON "PackageSelection"("language");
