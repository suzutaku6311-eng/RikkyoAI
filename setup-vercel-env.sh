#!/bin/bash
# Vercel環境変数設定スクリプト

echo "Vercel環境変数を設定します..."
echo ""

# プロジェクトをリンク（初回のみ）
echo "1. プロジェクトをリンク中..."
vercel link --yes

echo ""
echo "2. 環境変数を追加します..."
echo ""

# NEXT_PUBLIC_SUPABASE_URL
echo "NEXT_PUBLIC_SUPABASE_URL を追加中..."
echo "https://fzhrybiuspoxovctdogb.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development

# NEXT_PUBLIC_SUPABASE_ANON_KEY
echo ""
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY を追加中..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHR5Yml1c3BveG92Y3Rkb2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDUwODksImV4cCI6MjA3OTU4MTA4OX0.JKWOz2xG3aokS1qMPrU1LlFFFLGamX8rHq_Xft9ForA" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development

# OPENAI_API_KEY
echo ""
echo "OPENAI_API_KEY を追加中..."
echo "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" | vercel env add OPENAI_API_KEY production preview development

echo ""
echo "3. 設定された環境変数を確認中..."
vercel env ls

echo ""
echo "完了！環境変数が設定されました。"
echo "Vercelダッシュボードで再デプロイを実行してください。"











