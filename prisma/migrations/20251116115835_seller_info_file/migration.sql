/*
  Warnings:

  - Added the required column `startDate` to the `PackageSelection` table without a default value. This is not possible if the table is not empty.
  - Made the column `sellerId` on table `PackageSelection` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PackageSelection" ADD COLUMN     "billingPeriod" TEXT,
ADD COLUMN     "commissionPercentage" DOUBLE PRECISION,
ADD COLUMN     "startDate" TEXT NOT NULL,
ALTER COLUMN "agreementVersion" SET DEFAULT 'SellerAgreement_6.3_2026-01',
ALTER COLUMN "sellerId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "PackageSelection_sellerId_idx" ON "PackageSelection"("sellerId");
