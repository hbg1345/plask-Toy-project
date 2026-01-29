-- problems 테이블에 hints 컬럼 추가 (AI 생성 힌트 캐싱용)
ALTER TABLE problems ADD COLUMN IF NOT EXISTS hints JSONB;

-- 예시 구조:
-- [{"step": 1, "content": "..."}, {"step": 2, "content": "..."}, ...]
