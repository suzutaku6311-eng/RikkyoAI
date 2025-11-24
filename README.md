# 社内文書AIシステム（RAG）

Next.js 14（App Router）+ TypeScript + Supabase + OpenAI を使った RAG システムです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseのセットアップ

Supabaseでデータベースを作成し、以下のテーブルを作成してください：

詳細は `SUPABASE_SCHEMA.md` を参照してください。

- `documents` テーブル：文書のメタ情報
- `chunks` テーブル：チャンクとEmbedding（pgvector拡張が必要）

### 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI設定
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構成

```
project-root/
├─ app/              # Next.js App Router
├─ components/       # Reactコンポーネント
├─ lib/              # 共通ロジック（Supabase, OpenAI, RAG等）
├─ types/            # TypeScript型定義
├─ scripts/          # 一括処理スクリプト
└─ public/           # 静的ファイル
```

## デプロイ

Vercelへのデプロイ手順は `DEPLOY.md` を参照してください。

### クイックデプロイ

1. GitHubリポジトリを作成
2. コードをプッシュ:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. VercelでGitHubリポジトリをインポート
4. 環境変数を設定（`DEPLOY.md`を参照）

## 詳細仕様

- `requirements_RikkyoAI.md` - 要件定義書
- `cursor-rules_RikkyoAI.md` - 開発ルール
- `DEPLOY.md` - デプロイ手順

