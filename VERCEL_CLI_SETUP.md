# Vercel CLIで環境変数を設定する方法

ブラウザで設定できない場合、コマンドラインから設定できます。

## ステップ1: Vercel CLIをインストール

```bash
npm install -g vercel
```

## ステップ2: Vercelにログイン

```bash
vercel login
```

ブラウザが開くので、GitHubアカウントでログインしてください。

## ステップ3: プロジェクトをリンク（初回のみ）

```bash
cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"
vercel link
```

以下の質問に答えます：
- Set up and deploy? → **Y**
- Which scope? → あなたのアカウントを選択
- Link to existing project? → **Y**
- What's the name of your existing project? → **RikkyoAI** または **rikkyo-ai**

## ステップ4: 環境変数を設定

以下の3つのコマンドを実行してください：

### ① NEXT_PUBLIC_SUPABASE_URL

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
```

値の入力が求められたら、以下を貼り付け:
```
https://fzhrybiuspoxovctdogb.supabase.co
```

### ② NEXT_PUBLIC_SUPABASE_ANON_KEY

```bash
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
```

値の入力が求められたら、以下を貼り付け:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHR5Yml1c3BveG92Y3Rkb2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDUwODksImV4cCI6MjA3OTU4MTA4OX0.JKWOz2xG3aokS1qMPrU1LlFFFLGamX8rHq_Xft9ForA
```

### ③ OPENAI_API_KEY

```bash
vercel env add OPENAI_API_KEY production preview development
```

値の入力が求められたら、以下を貼り付け:
```
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
```

## ステップ5: 確認

設定した環境変数を確認:

```bash
vercel env ls
```

3つの環境変数が表示されることを確認してください。

## ステップ6: 再デプロイ

環境変数を追加した後、再デプロイが必要です：

```bash
vercel --prod
```

または、Vercelダッシュボードから「Redeploy」を実行してください。

## トラブルシューティング

### 「vercel: command not found」エラー

Vercel CLIがインストールされていません。以下を実行:

```bash
npm install -g vercel
```

### ログインエラー

```bash
vercel logout
vercel login
```

### プロジェクトが見つからない

```bash
vercel link
```

プロジェクト名を確認して、正しいプロジェクトを選択してください。

