# Supabase セットアップ手順書（RAG社内文書AI用）

## 📋 セットアップ手順の概要

1. **Supabaseプロジェクトを作成**
2. **接続情報を取得して `.env.local` に設定**
3. **SQL Editorで `supabase-schema.sql` を実行**

詳細な手順は `SETUP_GUIDE.md` を参照してください。

---

## 1. Supabase プロジェクト作成

1. https://supabase.com にアクセスし、GitHub などでログイン。

2. 「New project」をクリック。

3. プロジェクト名・パスワード・リージョンを設定して作成。
   - **Name**: `rag-internal-ai`（任意）
   - **Database Password**: 強力なパスワードを設定
   - **Region**: `Northeast Asia (Tokyo)` を推奨

4. プロジェクトが立ち上がったら Dashboard に移動。

---

## 2. 接続情報の取得と設定

### 2.1 API情報を取得

Supabase Dashboard の「**Settings → API**」から以下を取得する。

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.2 .env.localファイルを作成

プロジェクトルートに `.env.local` ファイルを作成し、以下を記述する：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI設定（後で設定可）
OPENAI_API_KEY=your_openai_api_key_here
```

**重要**: 
- `NEXT_PUBLIC_` プレフィックスは必須
- 値の前後に余分なスペースを入れない

---

## 3. データベーステーブルの作成

### 3.1 SQL Editorを開く

Supabase Dashboard の「**SQL Editor**」を開き、「**New query**」をクリック。

### 3.2 SQLを実行

プロジェクト内の `supabase-schema.sql` ファイルの内容をコピーして、SQL Editorに貼り付け、「**Run**」をクリック。

または、以下のSQLを直接実行する：

### 3.1 pgvector拡張の有効化

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3.2 documents テーブルの作成

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

### 3.3 chunks テーブルの作成

```sql
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(3072), -- text-embedding-3-largeの次元数
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.4 ベクトル検索用インデックスの作成（オプション）

データが蓄積されてから実行することを推奨します。

```sql
CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops);
```

---

## 4. 確認

- `.env.local` に接続情報が設定されているか確認
- Supabase Dashboard の「Table Editor」で `documents` と `chunks` テーブルが作成されているか確認

詳細なテーブル構造は `SUPABASE_SCHEMA.md` を参照してください。

