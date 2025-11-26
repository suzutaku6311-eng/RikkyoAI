-- documentsテーブルにfile_pathカラムを追加
-- Supabase Dashboard の SQL Editor で実行してください

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- 既存の文書に対してfile_pathを設定（オプション）
-- UPDATE documents SET file_path = 'documents/' || id::text || '/' || file_name WHERE file_path IS NULL;

