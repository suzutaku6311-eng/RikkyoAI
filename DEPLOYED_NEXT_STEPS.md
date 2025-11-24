# デプロイ後の次のステップ

## ✅ 完了した作業

1. ✅ Next.js 14プロジェクトの初期構成
2. ✅ Supabaseプロジェクトの作成とテーブル設定
3. ✅ 環境変数の設定（Supabase + OpenAI）
4. ✅ PDF ingest処理の実装
5. ✅ PDFアップロードUIの実装
6. ✅ RAG検索APIの実装
7. ✅ 質問UIの実装
8. ✅ 文書一覧機能の実装
9. ✅ GitHubリポジトリへのプッシュ
10. ✅ Vercelへのデプロイ完了

**デプロイURL**: https://rikkyo-ai.vercel.app

---

## 🔧 優先度の高い次のステップ

### 1. RAG検索機能の修正（最重要）

現在、検索結果が0件になる問題があります。原因はSupabaseのpgvector型が配列として正しく取得できていない可能性があります。

**対応方法**:
- Vercelのログで「最初のチャンクのEmbedding形式」を確認
- SupabaseのRPC関数（`match_chunks`）を作成してベクトル検索を最適化
- または、Embeddingの取得方法を修正

### 2. 動作確認とテスト

- [ ] PDFアップロード機能のテスト
- [ ] RAG検索機能のテスト
- [ ] エラーハンドリングの確認

### 3. 機能改善

- [ ] 検索結果の表示改善（類似度の可視化）
- [ ] ローディング状態の改善
- [ ] エラーメッセージの改善

---

## 📊 中優先度の機能追加

### 1. Supabase RPC関数の作成

ベクトル検索を高速化するため、SupabaseにRPC関数を作成：

```sql
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
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

### 2. 検索機能の改善

- 検索結果のページネーション
- 検索履歴の保存
- お気に入り機能

### 3. UI/UXの改善

- レスポンシブデザインの最適化
- ダークモード対応
- アニメーション追加

---

## 🔒 セキュリティ・運用

### 1. 認証機能の追加

- ユーザー認証（Supabase Auth）
- ロールベースアクセス制御（RBAC）
- 文書ごとの閲覧権限設定

### 2. 監視・ログ

- エラートラッキング（Sentry等）
- アクセスログの記録
- パフォーマンス監視

### 3. バックアップ・復旧

- データベースの定期バックアップ
- 災害復旧計画

---

## 📈 将来の拡張機能

### 1. 文書形式の拡張

- DOCXファイルの対応
- TXTファイルの対応
- 画像からのOCR

### 2. 高度な検索機能

- 複数キーワード検索
- 日付範囲検索
- 文書タイプでのフィルタリング

### 3. 統合機能

- Notion連携
- Google Drive連携
- Slack連携

---

## 🐛 既知の問題

1. **RAG検索が0件になる問題**
   - 原因: Supabaseのpgvector型が配列として取得できていない
   - 対応: RPC関数の作成またはEmbedding取得方法の修正

2. **Embedding形式の問題**
   - ログで「有効なチャンク: 0, 無効なチャンク: 806」と表示される
   - 対応: Embeddingの形式を確認して修正

---

## 📚 参考資料

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- `requirements_RikkyoAI.md` - 要件定義書
- `cursor-rules_RikkyoAI.md` - 開発ルール

