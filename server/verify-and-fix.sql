-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'PackageSelection'
  AND column_name IN ('commissionPercentage', 'billingPeriod', 'startDate')
ORDER BY column_name;

-- Check if there are records without these values
SELECT 
    COUNT(*) as total_records,
    COUNT("commissionPercentage") as records_with_commission,
    COUNT("billingPeriod") as records_with_billing,
    COUNT("startDate") as records_with_startdate
FROM "PackageSelection";

-- Show recent records
SELECT 
    id,
    package,
    "commissionPercentage",
    "billingPeriod",
    "startDate",
    "createdAt"
FROM "PackageSelection"
ORDER BY "createdAt" DESC
LIMIT 10;

