-- chat_history 테이블에 hints 컬럼 추가
ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS hints JSONB;

-- 예시 구조:
-- [{"step": 1, "content": "..."}, {"step": 2, "content": "..."}, ...]
