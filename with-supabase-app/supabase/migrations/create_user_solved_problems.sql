-- 사용자별 풀이 문제 목록 테이블
-- AtCoder API에서 가져온 풀이 목록을 캐싱하여 성능 향상

CREATE TABLE IF NOT EXISTS user_solved_problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  contest_id TEXT NOT NULL,
  solved_at TIMESTAMP WITH TIME ZONE, -- 최초 AC 시간
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 사용자당 문제당 하나의 레코드만 허용
  UNIQUE(user_id, problem_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_solved_problems_user_id ON user_solved_problems(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solved_problems_problem_id ON user_solved_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_user_solved_problems_contest_id ON user_solved_problems(contest_id);

-- RLS 정책
ALTER TABLE user_solved_problems ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 풀이 목록만 조회 가능
CREATE POLICY "Users can view own solved problems"
  ON user_solved_problems FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 풀이 목록만 추가 가능
CREATE POLICY "Users can insert own solved problems"
  ON user_solved_problems FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 풀이 목록만 수정 가능
CREATE POLICY "Users can update own solved problems"
  ON user_solved_problems FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 풀이 목록만 삭제 가능
CREATE POLICY "Users can delete own solved problems"
  ON user_solved_problems FOR DELETE
  USING (auth.uid() = user_id);

-- 마지막 동기화 시간을 저장하기 위해 user_info 테이블에 컬럼 추가
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS solved_problems_synced_at TIMESTAMP WITH TIME ZONE;
