# Vercel環境変数設定（正しい手順）

## 正しいコマンド構文

Vercel CLIでは、環境変数を**各環境ごとに個別に追加**する必要があります。

## 手順

### ステップ1: すべての環境に追加する方法（推奨）

環境を指定せずに実行すると、対話形式で選択できます：

```bash
# ① NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
# → 値の入力が求められたら: https://fzhrybiuspoxovctdogb.supabase.co
# → 環境の選択が求められたら: Production, Preview, Development のすべてを選択

# ② NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# → 値の入力が求められたら: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHR5Yml1c3BveG92Y3Rkb2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDUwODksImV4cCI6MjA3OTU4MTA4OX0.JKWOz2xG3aokS1qMPrU1LlFFFLGamX8rHq_Xft9ForA
# → 環境の選択が求められたら: Production, Preview, Development のすべてを選択

# ③ OPENAI_API_KEY
vercel env add OPENAI_API_KEY
# → 値の入力が求められたら: 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
# → 環境の選択が求められたら: Production, Preview, Development のすべてを選択
```

### ステップ2: 各環境に個別に追加する方法

各環境に対して個別にコマンドを実行することもできます：

```bash
# NEXT_PUBLIC_SUPABASE_URL
echo "https://fzhrybiuspoxovctdogb.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://fzhrybiuspoxovctdogb.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://fzhrybiuspoxovctdogb.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

# NEXT_PUBLIC_SUPABASE_ANON_KEY
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHR5Yml1c3BveG92Y3Rkb2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDUwODksImV4cCI6MjA3OTU4MTA4OX0.JKWOz2xG3aokS1qMPrU1LlFFFLGamX8rHq_Xft9ForA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHR5Yml1c3BveG92Y3Rkb2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDUwODksImV4cCI6MjA3OTU4MTA4OX0.JKWOz2xG3aokS1qMPrU1LlFFFLGamX8rHq_Xft9ForA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHR5Yml1c3BveG92Y3Rkb2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDUwODksImV4cCI6MjA3OTU4MTA4OX0.JKWOz2xG3aokS1qMPrU1LlFFFLGamX8rHq_Xft9ForA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

# OPENAI_API_KEY
echo "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" | vercel env add OPENAI_API_KEY production
echo "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" | vercel env add OPENAI_API_KEY preview
echo "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" | vercel env add OPENAI_API_KEY development
```

## 確認

```bash
vercel env ls
```

3つの環境変数が、それぞれ3つの環境（Production, Preview, Development）に設定されていることを確認してください。

## 再デプロイ

環境変数を設定した後、Vercelダッシュボードで再デプロイを実行してください。











