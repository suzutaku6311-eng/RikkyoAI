# Supabase テーブル構造

このプロジェクトで使用するSupabaseのテーブル構造です。

## documents テーブル

文書のメタ情報を保存するテーブルです。

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'docx', 'txt'
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## chunks テーブル

文書をチャンク分割したテキストとEmbeddingを保存するテーブルです。
pgvector拡張を使用してベクトル検索を行います。

```sql
-- pgvector拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(3072), -- text-embedding-3-largeの次元数
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ベクトル検索用のインデックス
CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops);
```

## 注意事項

- `embedding` カラムの次元数は、使用するEmbeddingモデルに合わせて調整してください
  - `text-embedding-3-large`: 3072次元
  - `text-embedding-3-small`: 1536次元
  - `text-embedding-ada-002`: 1536次元

- インデックスの作成は、ある程度データが蓄積されてから行うことを推奨します（ivfflatインデックスは初期データ量に依存します）

