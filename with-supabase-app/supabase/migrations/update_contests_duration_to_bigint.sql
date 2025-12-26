-- Update duration_second column from INTEGER to BIGINT
-- Some contests have duration values that exceed INTEGER range (e.g., 3153600000)

-- Drop the table if it exists and recreate with correct type
-- Or use ALTER TABLE if you want to preserve existing data

-- Option 1: If table is empty or you can recreate it
-- DROP TABLE IF EXISTS contests CASCADE;
-- Then run create_contests_table.sql again

-- Option 2: Alter existing column (if table has data you want to keep)
ALTER TABLE contests 
ALTER COLUMN duration_second TYPE BIGINT;

