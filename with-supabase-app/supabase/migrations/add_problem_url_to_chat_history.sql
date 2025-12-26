-- Add problem_url column to chat_history table
-- This column stores the AtCoder problem URL when a chat is created from a problem

ALTER TABLE chat_history
ADD COLUMN IF NOT EXISTS problem_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_history_problem_url ON chat_history(problem_url);

-- Add comment
COMMENT ON COLUMN chat_history.problem_url IS 'AtCoder problem URL when chat is created from a problem';

