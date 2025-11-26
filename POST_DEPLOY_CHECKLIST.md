# デプロイ後の確認チェックリスト

## ✅ ビルド状況

- ✅ ビルド成功（45秒で完了）
- ✅ すべてのルートが正しく生成
- ✅ エラーなし

## 🔍 動作確認項目

### 1. 基本ページの確認

- [ ] トップページ: https://rikkyo-ai.vercel.app
- [ ] 文書検索ページ: https://rikkyo-ai.vercel.app/ask
- [ ] 文書アップロードページ: https://rikkyo-ai.vercel.app/admin/upload
- [ ] 文書一覧ページ: https://rikkyo-ai.vercel.app/admin/documents

### 2. 機能テスト

#### PDFアップロード機能
- [ ] PDFファイルをアップロードできる
- [ ] アップロード成功メッセージが表示される
- [ ] エラーメッセージが適切に表示される

#### RAG検索機能
- [ ] 質問を入力できる
- [ ] 検索結果が返ってくる（現在は0件になる問題あり）
- [ ] エラーメッセージが適切に表示される

#### 文書一覧機能
- [ ] アップロードした文書が表示される
- [ ] チャンク数が正しく表示される
- [ ] 削除機能が動作する

### 3. エラーログの確認

Vercelダッシュボードで以下を確認：

1. **Functions タブ**でAPIエンドポイントのログを確認
2. **Deployments タブ**で最新のデプロイのログを確認
3. 特に `/api/ask` のログで以下を確認：
   - 「最初のチャンクのEmbedding形式」のログ
   - 「有効なチャンク」と「無効なチャンク」の数

---

## 🐛 既知の問題と対応

### 問題1: RAG検索が0件になる

**症状**: 「関連する文書が見つかりませんでした」と表示される

**原因**: Supabaseのpgvector型が配列として取得できていない可能性

**対応方法**:

#### 方法A: Supabase RPC関数を作成（推奨）

Supabase Dashboard → SQL Editor で以下を実行：

```sql
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
  WHERE 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### 方法B: Vercelのログを確認して修正

1. Vercelダッシュボード → プロジェクト → Deployments
2. 最新のデプロイをクリック → Functions タブ
3. `/api/ask` をクリック
4. 「最初のチャンクのEmbedding形式」のログを確認
5. ログの内容を共有していただければ、修正方法を提案します

---

## 📊 パフォーマンス確認

- [ ] ページの読み込み速度
- [ ] APIレスポンス時間
- [ ] エラー率

---

## 🔒 セキュリティ確認

- [ ] 環境変数が正しく設定されている
- [ ] APIキーが公開されていない
- [ ] 適切なエラーハンドリングが実装されている

---

## 📝 次の改善項目

1. **RAG検索の修正**（最優先）
2. UI/UXの改善
3. エラーハンドリングの強化
4. パフォーマンスの最適化
5. 認証機能の追加











