# Supabase Storage セットアップガイド

PDFファイルを閲覧するために、Supabase Storageの設定が必要です。

## 1. Storage バケットの作成

1. Supabase Dashboard にログイン
2. 左メニューから「Storage」を選択
3. 「Create a new bucket」をクリック
4. 以下の設定でバケットを作成：
   - **Name**: `documents`
   - **Public bucket**: ✅ チェックを入れる（PDFファイルを公開閲覧するため）
   - **File size limit**: 適切なサイズを設定（例: 10MB）
   - **Allowed MIME types**: `application/pdf` を追加

## 2. Storage ポリシーの設定

バケット作成後、以下のSQLをSupabase DashboardのSQL Editorで実行して、公開読み取りを許可します：

```sql
-- documentsバケットの公開読み取りポリシー
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
```

## 3. documentsテーブルにfile_pathカラムを追加

以下のSQLを実行して、documentsテーブルに`file_path`カラムを追加します：

```sql
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_path TEXT;
```

このSQLは `migrations/add_file_path_to_documents.sql` にも保存されています。

## 4. 確認

- Storageバケット「documents」が作成されている
- 公開読み取りポリシーが設定されている
- documentsテーブルに`file_path`カラムが追加されている

これで、PDFファイルのアップロードと閲覧が可能になります。

