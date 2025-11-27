-- Google Sheets連携用テーブル作成
CREATE TABLE IF NOT EXISTS google_sheets_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spreadsheet_id TEXT NOT NULL, -- Google Spreadsheet ID
  spreadsheet_url TEXT NOT NULL, -- スプレッドシートのURL
  sheet_name TEXT NOT NULL, -- シート名（例: "議事録"）
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE, -- 関連するdocumentレコード
  last_synced_at TIMESTAMPTZ, -- 最終同期時刻
  last_sheet_modified_at TIMESTAMPTZ, -- スプレッドシートの最終更新時刻
  sync_enabled BOOLEAN DEFAULT true, -- 同期を有効にするか
  sync_interval_minutes INTEGER DEFAULT 60, -- 同期間隔（分）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_google_sheets_sources_sync_enabled 
  ON google_sheets_sources(sync_enabled) 
  WHERE sync_enabled = true;

CREATE INDEX IF NOT EXISTS idx_google_sheets_sources_spreadsheet_id 
  ON google_sheets_sources(spreadsheet_id);

-- documentsテーブルの拡張
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'upload'; -- 'upload' | 'google_sheets'

ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS google_sheet_source_id UUID REFERENCES google_sheets_sources(id);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_documents_source_type 
  ON documents(source_type);

CREATE INDEX IF NOT EXISTS idx_documents_google_sheet_source_id 
  ON documents(google_sheet_source_id);

