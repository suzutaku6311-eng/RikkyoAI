# Supabase設定詳細ガイド

このドキュメントでは、Rikkyo AIシステムを完全に動作させるために必要なSupabaseの設定手順を詳しく説明します。

---

## 📋 目次

1. [Supabase RPC関数の作成](#1-supabase-rpc関数の作成)
2. [検索履歴テーブルの作成](#2-検索履歴テーブルの作成)
3. [Supabase Storageの設定](#3-supabase-storageの設定)

---

## 1. Supabase RPC関数の作成

### 目的
ベクトル検索を高速化するためのPostgreSQL関数を作成します。この関数により、データベース側で直接ベクトル検索が実行され、パフォーマンスが大幅に向上します。

### 手順

#### ステップ1: Supabase Dashboardにアクセス
1. ブラウザで [https://supabase.com/dashboard](https://supabase.com/dashboard) を開く
2. ログイン（まだの場合はアカウントを作成）
3. プロジェクト一覧から「Rikkyo AI」プロジェクトを選択

#### ステップ2: SQL Editorを開く
1. 左側のメニューから **「SQL Editor」** をクリック
   - アイコンは「</>」のような記号
   - または、メニューから「SQL Editor」を探す

#### ステップ3: 新しいクエリを作成
1. SQL Editor画面で、右上の **「New query」** ボタンをクリック
   - または、既存のクエリエリアをクリックして編集可能にする

#### ステップ4: SQLをコピー＆ペースト
1. プロジェクト内の `migrations/create_match_chunks_function.sql` ファイルを開く
2. ファイルの内容をすべてコピー（`Ctrl+C` または `Cmd+C`）
3. SupabaseのSQL Editorにペースト（`Ctrl+V` または `Cmd+V`）

**SQLの内容:**
```sql
-- Supabase RPC関数: match_chunks
-- ベクトル検索を高速化するための関数
-- Supabase Dashboard の SQL Editor で実行してください

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.7,
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
  WHERE 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 関数の説明コメント
COMMENT ON FUNCTION match_chunks IS 'ベクトル検索で類似チャンクを取得する関数。コサイン類似度を使用。';
```

#### ステップ5: SQLを実行
1. SQL Editorの下部にある **「Run」** ボタンをクリック
   - または、キーボードショートカット `Ctrl+Enter`（Windows/Linux）または `Cmd+Enter`（Mac）
2. 実行が成功すると、画面下部に「Success. No rows returned」または「Success」というメッセージが表示されます

#### ステップ6: 動作確認
1. 左側のメニューから **「Database」** → **「Functions」** をクリック
2. 関数一覧に `match_chunks` が表示されていることを確認
3. 関数名をクリックすると、詳細情報が表示されます

### エラーが発生した場合

**エラー1: "function match_chunks already exists"**
- 解決方法: これは正常です。`CREATE OR REPLACE FUNCTION` を使用しているため、既存の関数が更新されます
- そのまま実行を続けて問題ありません

**エラー2: "type vector does not exist"**
- 原因: pgvector拡張が有効化されていない
- 解決方法: 以下のSQLを先に実行してください：
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

**エラー3: "relation chunks does not exist"**
- 原因: `chunks`テーブルが存在しない
- 解決方法: まず `supabase-schema.sql` を実行してテーブルを作成してください

---

## 2. 検索履歴テーブルの作成

### 目的
ユーザーの検索履歴を保存するテーブルを作成します。これにより、過去の質問と回答を確認できるようになります。

### 手順

#### ステップ1: SQL Editorを開く
1. Supabase Dashboardで **「SQL Editor」** を開く（上記と同じ手順）

#### ステップ2: 新しいクエリを作成
1. **「New query」** ボタンをクリック
   - または、既存のクエリエリアをクリック

#### ステップ3: SQLをコピー＆ペースト
1. プロジェクト内の `migrations/create_search_history_table.sql` ファイルを開く
2. ファイルの内容をすべてコピー
3. SupabaseのSQL Editorにペースト

**SQLの内容:**
```sql
-- 検索履歴テーブルの作成
-- Supabase Dashboard の SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  chunks_used JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT -- 将来的に認証機能を追加した場合に使用
);

-- インデックスの作成（検索履歴の高速取得のため）
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id) WHERE user_id IS NOT NULL;

-- コメント
COMMENT ON TABLE search_history IS '検索履歴を保存するテーブル';
COMMENT ON COLUMN search_history.chunks_used IS '使用されたチャンクのIDとメタデータをJSON形式で保存';
```

#### ステップ4: SQLを実行
1. **「Run」** ボタンをクリック（または `Ctrl+Enter` / `Cmd+Enter`）
2. 成功メッセージが表示されることを確認

#### ステップ5: 動作確認
1. 左側のメニューから **「Table Editor」** をクリック
2. テーブル一覧に `search_history` が表示されていることを確認
3. テーブル名をクリックすると、テーブルの構造が表示されます

**テーブル構造の確認:**
- `id` (uuid, Primary Key)
- `question` (text)
- `answer` (text)
- `chunks_used` (jsonb)
- `created_at` (timestamptz)
- `user_id` (text, nullable)

### エラーが発生した場合

**エラー1: "relation search_history already exists"**
- 解決方法: `CREATE TABLE IF NOT EXISTS` を使用しているため、既に存在する場合はスキップされます
- これは正常な動作です

**エラー2: "permission denied"**
- 原因: データベースへの書き込み権限がない
- 解決方法: Supabaseプロジェクトのオーナー権限があることを確認してください

---

## 3. Supabase Storageの設定

### 目的
PDFファイルなどの文書を保存するためのストレージバケットを作成し、公開アクセスを設定します。

### 手順

#### ステップ1: Storageにアクセス
1. Supabase Dashboardの左側メニューから **「Storage」** をクリック
   - アイコンは「📦」のような記号

#### ステップ2: バケットの存在確認
1. Storage画面で、バケット一覧を確認
2. **「documents」** という名前のバケットが存在するか確認

#### ステップ3A: バケットが存在しない場合（新規作成）

1. **「New bucket」** または **「Create bucket」** ボタンをクリック
2. バケット名に **「documents」** を入力
   - 重要: 名前は正確に「documents」である必要があります（大文字小文字を区別）
3. **「Public bucket」** のチェックボックスを**オン**にする
   - これにより、認証なしでファイルにアクセスできるようになります
4. **「Create bucket」** ボタンをクリック

#### ステップ3B: バケットが既に存在する場合

1. **「documents」** バケットをクリックして開く
2. バケットの設定を確認

#### ステップ4: 公開ポリシーの設定確認

1. **「documents」** バケットを開いた状態で、**「Policies」** タブをクリック
   - または、バケット一覧から「documents」を選択し、「Policies」を確認

2. 以下のポリシーが存在することを確認：
   - **「Public Access」** または **「SELECT」** ポリシー

#### ステップ5: 公開ポリシーが存在しない場合（新規作成）

**方法1: SQL Editorから作成（推奨）**

1. **「SQL Editor」** を開く
2. 以下のSQLを実行：

```sql
-- Storageバケット「documents」の公開読み取りポリシーを作成
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
```

3. **「Run」** ボタンをクリックして実行

**方法2: Storage UIから作成**

1. Storage画面で「documents」バケットを開く
2. **「Policies」** タブをクリック
3. **「New Policy」** または **「Create Policy」** をクリック
4. ポリシー名に **「Public Access」** を入力
5. 操作（Operation）で **「SELECT」** を選択
6. ターゲット（Target）で **「All objects」** を選択
7. 条件（Using expression）に以下を入力：
   ```
   bucket_id = 'documents'
   ```
8. **「Save」** または **「Create」** をクリック

#### ステップ6: 動作確認

1. **「documents」** バケットを開く
2. バケット内にファイルをアップロードしてテスト
   - **「Upload file」** ボタンをクリック
   - テスト用のPDFファイルを選択
   - アップロードが成功することを確認

3. アップロードしたファイルのURLを確認
   - ファイル名をクリック
   - **「Public URL」** または **「URL」** をコピー
   - 新しいタブでURLを開いて、ファイルが表示されることを確認

### エラーが発生した場合

**エラー1: "bucket already exists"**
- 解決方法: 既にバケットが存在する場合は、そのまま使用できます
- ステップ3Bに進んでください

**エラー2: "permission denied for schema storage"**
- 原因: Storageスキーマへのアクセス権限がない
- 解決方法: Supabaseプロジェクトのオーナー権限があることを確認してください

**エラー3: ポリシー作成時にエラー**
- 原因: ポリシーの構文エラーまたは権限不足
- 解決方法: SQL Editorから直接実行する方法（方法1）を試してください

---

## ✅ 設定完了後の確認チェックリスト

すべての設定が完了したら、以下を確認してください：

- [ ] `match_chunks` 関数が作成されている（Database → Functions）
- [ ] `search_history` テーブルが作成されている（Table Editor）
- [ ] `documents` バケットが存在する（Storage）
- [ ] `documents` バケットに公開ポリシーが設定されている（Storage → Policies）
- [ ] テストファイルをアップロードして、公開URLでアクセスできる

---

## 🔍 トラブルシューティング

### 問題1: RPC関数が動作しない

**症状**: 検索時に「RPC関数が存在しないため、クライアント側でベクトル検索を実行します」というログが表示される

**確認方法**:
1. Supabase Dashboard → Database → Functions
2. `match_chunks` 関数が存在するか確認

**解決方法**:
- 関数が存在しない場合は、ステップ1を再実行
- 関数が存在する場合は、関数の定義を確認（パラメータの型が正しいか）

### 問題2: 検索履歴が保存されない

**症状**: 検索を実行しても履歴に表示されない

**確認方法**:
1. Supabase Dashboard → Table Editor → `search_history`
2. テーブルが存在し、データが保存されているか確認

**解決方法**:
- テーブルが存在しない場合は、ステップ2を再実行
- テーブルが存在する場合は、Vercelのログでエラーを確認

### 問題3: PDFファイルがダウンロードできない

**症状**: 「PDF file not found in storage」エラーが表示される

**確認方法**:
1. Supabase Dashboard → Storage → `documents`
2. バケット内にファイルが存在するか確認
3. バケットの公開ポリシーが設定されているか確認

**解決方法**:
- バケットが存在しない場合は、ステップ3Aを実行
- 公開ポリシーが設定されていない場合は、ステップ5を実行
- ファイルが存在しない場合は、PDFを再アップロード

---

## 📚 参考資料

- [Supabase公式ドキュメント - SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Supabase公式ドキュメント - Storage](https://supabase.com/docs/guides/storage)
- [Supabase公式ドキュメント - RPC Functions](https://supabase.com/docs/guides/database/functions)

---

## 💡 補足情報

### RPC関数のパラメータ説明

- `query_embedding`: 検索クエリのEmbeddingベクトル（3072次元）
- `match_threshold`: 類似度の閾値（0.0〜1.0、デフォルト: 0.7）
  - 0.7 = 70%以上の類似度を持つチャンクのみを返す
- `match_count`: 返すチャンクの最大数（デフォルト: 10）

### 検索履歴テーブルのカラム説明

- `id`: 一意のID（自動生成）
- `question`: ユーザーが入力した質問
- `answer`: AIが生成した回答
- `chunks_used`: 使用されたチャンクのメタデータ（JSON形式）
- `created_at`: 検索実行日時（自動設定）
- `user_id`: ユーザーID（認証機能追加時に使用）

### Storageバケットの命名規則

- バケット名は小文字で統一することを推奨
- 「documents」という名前は、コード内でハードコードされているため変更しないでください

---

## 🎯 次のステップ

設定が完了したら：

1. **アプリケーションをテスト**
   - PDFをアップロードして、ダウンロードできるか確認
   - 検索を実行して、履歴が保存されるか確認
   - 検索速度が向上しているか確認（RPC関数使用時）

2. **パフォーマンスの確認**
   - Vercelのログで、RPC関数が使用されているか確認
   - 検索速度を測定

3. **追加機能の実装**
   - `UPGRADE_TODO.md` を参照して、次の機能を実装

---

更新日: 2025-11-26

