-- Supabase テーブル作成SQL
-- Supabase Dashboard の SQL Editor で実行してください

-- pgvector拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- documents テーブル（文書のメタ情報）
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'txt'
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- chunks テーブル（チャンクとEmbedding）
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(3072), -- text-embedding-3-largeの次元数
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ベクトル検索用インデックス（データが蓄積されてから実行推奨）
-- CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops);

