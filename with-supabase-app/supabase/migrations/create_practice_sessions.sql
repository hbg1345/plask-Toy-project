-- 연습 세션 기록 테이블
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  problem_title TEXT,
  difficulty INTEGER,
  time_limit INTEGER NOT NULL, -- 설정한 시간 (초)
  elapsed_time INTEGER NOT NULL, -- 실제 소요 시간 (초)
  hints_used INTEGER NOT NULL DEFAULT 0, -- 사용한 힌트 수
  solved BOOLEAN NOT NULL DEFAULT false, -- 풀었는지 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at DESC);

-- RLS 정책
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own practice sessions"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
