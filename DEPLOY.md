# デプロイ手順

このNext.jsアプリをVercelにデプロイする手順です。

## 前提条件

- GitHubアカウント
- Vercelアカウント（GitHubでサインイン可能）

## 手順

### 1. GitHubリポジトリの作成

1. https://github.com/new にアクセス
2. リポジトリ名を入力（例: `rikkyo-ai`）
3. 「Public」または「Private」を選択
4. 「Create repository」をクリック

### 2. ローカルリポジトリの初期化とプッシュ

```bash
# Gitリポジトリを初期化（まだの場合）
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit"

# GitHubリポジトリをリモートとして追加（YOUR_USERNAMEとYOUR_REPO_NAMEを置き換え）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

### 3. Vercelでのデプロイ

1. https://vercel.com にアクセス
2. 「Sign Up」→「Continue with GitHub」でGitHubアカウントでサインイン
3. 「Add New Project」をクリック
4. 作成したGitHubリポジトリを選択
5. 「Import」をクリック

### 4. 環境変数の設定

Vercelのプロジェクト設定で、以下の環境変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**重要**: 
- 環境変数は「Settings」→「Environment Variables」から追加
- すべての環境（Production, Preview, Development）に追加

### 5. デプロイの実行

1. 「Deploy」をクリック
2. デプロイが完了するまで待機（通常1-2分）
3. デプロイ完了後、Vercelが提供するURL（例: `https://rikkyo-ai.vercel.app`）でアクセス可能

## 注意事項

- `.env.local`ファイルはGitにコミットされません（`.gitignore`に含まれています）
- 環境変数はVercelのダッシュボードで設定してください
- デプロイ後も、SupabaseとOpenAIのAPIキーが正しく設定されているか確認してください

## トラブルシューティング

### デプロイが失敗する場合

1. ビルドログを確認（Vercelのダッシュボードで確認可能）
2. 環境変数が正しく設定されているか確認
3. `package.json`の依存関係が正しいか確認

### 環境変数が読み込まれない場合

1. Vercelの「Settings」→「Environment Variables」で確認
2. 環境変数名に`NEXT_PUBLIC_`プレフィックスが必要なものは正しく設定されているか確認
3. デプロイを再実行（環境変数を追加した後は再デプロイが必要）

