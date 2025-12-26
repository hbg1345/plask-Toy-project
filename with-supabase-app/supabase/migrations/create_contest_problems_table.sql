-- Create contest_problems table to store contest-problem relationships
-- This table improves query performance by pre-computing contest-problem mappings

CREATE TABLE IF NOT EXISTS contest_problems (
  contest_id TEXT NOT NULL,
  problem_id TEXT NOT NULL,
  problem_index TEXT NOT NULL,
  PRIMARY KEY (contest_id, problem_id),
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contest_problems_contest_id ON contest_problems(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_problem_id ON contest_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_problem_index ON contest_problems(problem_index);

-- Enable Row Level Security
ALTER TABLE contest_problems ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read contest_problems (public data)
CREATE POLICY "Contest problems are viewable by everyone"
    ON contest_problems
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users can insert/update contest_problems
CREATE POLICY "Authenticated users can insert contest_problems"
    ON contest_problems
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contest_problems"
    ON contest_problems
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

