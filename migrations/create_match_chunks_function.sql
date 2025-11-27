-- Supabase RPC関数: match_chunks
-- ベクトル検索を高速化するための関数
-- Supabase Dashboard の SQL Editor で実行してください

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  document_id uuid,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunks.id,
    chunks.content,
    chunks.document_id,
    chunks.chunk_index,
    1 - (chunks.embedding <=> query_embedding) as similarity
  FROM chunks
  WHERE chunks.embedding IS NOT NULL
    AND 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 関数の説明コメント
COMMENT ON FUNCTION match_chunks IS 'ベクトル検索で類似チャンクを取得する関数。コサイン類似度を使用。';

