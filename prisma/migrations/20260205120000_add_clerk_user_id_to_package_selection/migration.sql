-- AlterTable
ALTER TABLE "PackageSelection" ADD COLUMN "clerkUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PackageSelection_clerkUserId_key" ON "PackageSelection"("clerkUserId");

-- CreateIndex
CREATE INDEX "PackageSelection_clerkUserId_idx" ON "PackageSelection"("clerkUserId");
