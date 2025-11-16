-- Check if commissionPercentage and billingPeriod columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'PackageSelection'
  AND column_name IN ('commissionPercentage', 'billingPeriod');

-- Check recent records to see if values are being saved
SELECT id, package, "commissionPercentage", "billingPeriod", "createdAt"
FROM "PackageSelection"
ORDER BY "createdAt" DESC
LIMIT 10;

