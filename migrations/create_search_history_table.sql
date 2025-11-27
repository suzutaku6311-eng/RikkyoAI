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

