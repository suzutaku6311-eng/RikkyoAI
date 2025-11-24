# クイックデプロイ手順

## 1. GitHubリポジトリを作成

1. https://github.com/new にアクセス
2. リポジトリ名を入力（例: `rikkyo-ai`）
3. 「Public」または「Private」を選択
4. **「Initialize this repository with a README」はチェックしない**（既にローカルにコードがあるため）
5. 「Create repository」をクリック

## 2. ローカルコードをGitHubにプッシュ

GitHubでリポジトリを作成したら、表示されるコマンドを実行します：

```bash
cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"

# リモートリポジトリを追加（YOUR_USERNAMEとYOUR_REPO_NAMEを置き換え）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

## 3. Vercelでデプロイ

1. https://vercel.com にアクセス
2. 「Sign Up」→「Continue with GitHub」でGitHubアカウントでサインイン
3. 「Add New Project」をクリック
4. 作成したGitHubリポジトリを選択
5. 「Import」をクリック

## 4. 環境変数の設定

Vercelのプロジェクト設定画面で、以下の環境変数を追加：

### 「Environment Variables」セクションで追加：

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: あなたのSupabase URL（`.env.local`から取得）
   - Environment: Production, Preview, Development すべてにチェック

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: あなたのSupabase匿名キー（`.env.local`から取得）
   - Environment: Production, Preview, Development すべてにチェック

3. **OPENAI_API_KEY**
   - Value: あなたのOpenAI APIキー（`.env.local`から取得）
   - Environment: Production, Preview, Development すべてにチェック

**重要**: 実際のAPIキーは`.env.local`ファイルから取得してください。セキュリティのため、APIキーはGitHubにコミットしないでください。

## 5. デプロイ実行

1. 「Deploy」ボタンをクリック
2. デプロイが完了するまで待機（通常1-2分）
3. デプロイ完了後、Vercelが提供するURL（例: `https://rikkyo-ai.vercel.app`）でアクセス可能

## 完了！

デプロイが完了すると、Vercelのダッシュボードに表示されるURLからアプリにアクセスできます。

## トラブルシューティング

### ビルドエラーが発生する場合

- Vercelの「Deployments」タブでビルドログを確認
- 環境変数が正しく設定されているか確認
- `package.json`の依存関係が正しいか確認

### 環境変数が読み込まれない場合

- 環境変数を追加した後、必ず「Deploy」を再実行
- `NEXT_PUBLIC_`プレフィックスが必要な変数は正しく設定されているか確認

