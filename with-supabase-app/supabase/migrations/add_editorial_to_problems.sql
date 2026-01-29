-- problems 테이블에 editorial 컬럼 추가
ALTER TABLE problems ADD COLUMN IF NOT EXISTS editorial TEXT;

-- 인덱스는 필요 없음 (검색 안 할 거라서)
