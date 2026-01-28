-- 문제 번역 캐시 테이블
CREATE TABLE IF NOT EXISTS problem_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_url TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  translated_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- problem_url + target_lang 조합이 유니크해야 함
  UNIQUE(problem_url, target_lang)
);

-- 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_problem_translations_url_lang
  ON problem_translations(problem_url, target_lang);

-- RLS 정책 (모든 인증된 사용자가 읽기/쓰기 가능)
ALTER TABLE problem_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations" ON problem_translations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert translations" ON problem_translations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update translations" ON problem_translations
  FOR UPDATE USING (auth.role() = 'authenticated');
