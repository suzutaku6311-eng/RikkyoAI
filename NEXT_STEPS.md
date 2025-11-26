# 次のステップ

## ✅ 完了した作業

1. ✅ Next.js 14プロジェクトの初期構成
2. ✅ Supabaseプロジェクトの作成とテーブル設定
3. ✅ 環境変数の設定（Supabase + OpenAI）
4. ✅ PDF ingest処理の実装（`app/api/admin/ingest/route.ts`）

## 🚀 次のステップ

### 1. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

### 2. PDFアップロード機能のテスト

#### 2.1 APIエンドポイントのテスト

以下のコマンドでPDFアップロードをテストできます：

```bash
curl -X POST http://localhost:3000/api/admin/ingest \
  -F "file=@your-document.pdf" \
  -F "title=テスト文書"
```

#### 2.2 アップロード画面の作成（推奨）

`app/admin/upload/page.tsx` を作成して、ブラウザからPDFをアップロードできるUIを実装してください。

### 3. RAG検索機能の実装

#### 3.1 質問APIの実装

`app/api/ask/route.ts` を実装して、以下の機能を追加：

- 質問文をEmbedding化
- ベクトル検索で類似チャンクを取得
- LLMにプロンプトを送信して回答を生成

#### 3.2 質問UIの作成

`app/ask/page.tsx` を作成して、質問入力と回答表示のUIを実装してください。

### 4. 管理機能の実装

- 文書一覧表示（`app/admin/documents/page.tsx`）
- 文書削除機能
- Embedding再生成機能

## 📝 実装の優先順位

1. **高優先度**
   - PDFアップロードUI（`app/admin/upload/page.tsx`）
   - RAG検索API（`app/api/ask/route.ts`）
   - 質問UI（`app/ask/page.tsx`）

2. **中優先度**
   - 文書一覧表示
   - 回答の根拠文書表示

3. **低優先度**
   - 文書削除機能
   - Embedding再生成機能
   - 認証機能

## 🔧 開発時の便利コマンド

```bash
# 開発サーバー起動
npm run dev

# Supabase接続テスト
npm run test:supabase

# ビルド
npm run build

# 本番サーバー起動
npm start
```

## 📚 参考資料

- `requirements_RikkyoAI.md` - 要件定義書
- `cursor-rules_RikkyoAI.md` - 開発ルール
- `SUPABASE_SCHEMA.md` - データベース構造
- `supabase-setup.md` - Supabaseセットアップ手順











