-- Update problems table to use Kenkoo problem ID instead of link
-- This migration changes the schema to use Kenkoo's problem ID format

-- 주의: 기존 데이터가 있으면 삭제됩니다 (초기 테이블 구축 단계이므로 안전)
DELETE FROM problems;

-- First, drop existing constraints and indexes
DROP INDEX IF EXISTS idx_problems_link;
ALTER TABLE problems DROP CONSTRAINT IF EXISTS problems_link_key;

-- Drop primary key constraint first
ALTER TABLE problems DROP CONSTRAINT IF EXISTS problems_pkey;

-- Handle existing id column (UUID type)
DO $$
BEGIN
  -- Check if id column exists and is UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problems' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    -- Drop the old UUID id column
    ALTER TABLE problems DROP COLUMN id;
  END IF;
END $$;

-- Drop link column (no longer needed, can be generated from id)
ALTER TABLE problems DROP COLUMN IF EXISTS link;

-- Add id as TEXT (Kenkoo problem ID format like "abc138_a")
ALTER TABLE problems ADD COLUMN id TEXT NOT NULL;

-- Make id the primary key
ALTER TABLE problems ADD PRIMARY KEY (id);

-- Create index on id (already indexed as primary key, but explicit is good)
CREATE INDEX IF NOT EXISTS idx_problems_id ON problems(id);

-- Update the comment
COMMENT ON COLUMN problems.id IS 'Kenkoo problem ID (e.g., "abc138_a")';
COMMENT ON COLUMN problems.difficulty IS 'Problem difficulty from Kenkoo API (IRT-based)';
COMMENT ON COLUMN problems.summary IS 'One-line summary (optional, can be added later)';

