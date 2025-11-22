-- AlterTable
ALTER TABLE "PackageSelection" ADD COLUMN     "bic" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "isNewCustomer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kvkNumber" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "vatNumber" TEXT;

-- CreateIndex
CREATE INDEX "PackageSelection_isNewCustomer_idx" ON "PackageSelection"("isNewCustomer");
