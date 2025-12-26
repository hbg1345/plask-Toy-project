-- Create contests table for AtCoder contest information
CREATE TABLE IF NOT EXISTS contests (
  id TEXT PRIMARY KEY,
  start_epoch_second BIGINT NOT NULL,
  duration_second BIGINT NOT NULL,
  title TEXT NOT NULL,
  rate_change TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on start_epoch_second for efficient date-based sorting
CREATE INDEX IF NOT EXISTS idx_contests_start_epoch_second ON contests(start_epoch_second DESC);

-- Enable Row Level Security
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read contests (public data)
CREATE POLICY "Contests are viewable by everyone"
    ON contests
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users can insert/update contests
CREATE POLICY "Authenticated users can insert contests"
    ON contests
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contests"
    ON contests
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contests_updated_at ON contests;
CREATE TRIGGER update_contests_updated_at
    BEFORE UPDATE ON contests
    FOR EACH ROW
    EXECUTE FUNCTION update_contests_updated_at();

