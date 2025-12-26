-- Create problems table for AtCoder problem archive
CREATE TABLE IF NOT EXISTS problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  difficulty INTEGER, -- Average rating of participants who solved the problem (null if not calculated yet)
  summary TEXT, -- One-line summary of the problem
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_link ON problems(link);
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists, then create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_problems_updated_at ON problems;
CREATE TRIGGER update_problems_updated_at 
    BEFORE UPDATE ON problems 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Problems are viewable by everyone" ON problems;
DROP POLICY IF EXISTS "Authenticated users can insert problems" ON problems;
DROP POLICY IF EXISTS "Authenticated users can update problems" ON problems;

-- Policy: Everyone can read problems (public data)
CREATE POLICY "Problems are viewable by everyone"
    ON problems
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users can insert/update problems
-- (You can restrict this further to admin users if needed)
CREATE POLICY "Authenticated users can insert problems"
    ON problems
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update problems"
    ON problems
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

