-- Check if commissionPercentage and billingPeriod columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'PackageSelection'
  AND column_name IN ('commissionPercentage', 'billingPeriod')
ORDER BY column_name;

-- Check recent records
SELECT 
    id,
    package,
    "commissionPercentage",
    "billingPeriod",
    "startDate",
    "createdAt"
FROM "PackageSelection"
ORDER BY "createdAt" DESC
LIMIT 5;

