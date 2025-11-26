# Vercel環境変数設定のトラブルシューティング

## 「No environment variables were created」エラーが発生した場合

このエラーは、環境変数の追加に失敗したことを示しています。以下の手順を確認してください。

## 解決手順

### ステップ1: 環境変数設定画面を開く

1. Vercelダッシュボード: https://vercel.com/dashboard
2. プロジェクト「RikkyoAI」をクリック
3. 上部タブで「**Settings**」をクリック
4. 左側メニューまたはページ内で「**Environment Variables**」をクリック

### ステップ2: 環境変数を1つずつ追加

**重要**: 3つすべてを一度に追加しようとせず、**1つずつ**追加してください。

#### ① 最初の環境変数: NEXT_PUBLIC_SUPABASE_URL

1. 「**Add New**」または「**+ Add**」ボタンをクリック
2. **Key**欄に以下を入力（コピペ可）:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   ```
3. **Value**欄に以下を入力（コピペ可）:
   ```
   https://fzhrybiuspoxovctdogb.supabase.co
   ```
4. **Environment**で以下をすべてチェック:
   - ☑ Production
   - ☑ Preview  
   - ☑ Development
5. 「**Save**」または「**Add**」ボタンをクリック
6. 画面に「NEXT_PUBLIC_SUPABASE_URL」が表示されることを確認

#### ② 2つ目の環境変数: NEXT_PUBLIC_SUPABASE_ANON_KEY

1. 再度「**Add New**」または「**+ Add**」ボタンをクリック
2. **Key**欄に以下を入力:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
3. **Value**欄に以下を入力（長い文字列なので注意）:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHR5Yml1c3BveG92Y3Rkb2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDUwODksImV4cCI6MjA3OTU4MTA4OX0.JKWOz2xG3aokS1qMPrU1LlFFFLGamX8rHq_Xft9ForA
   ```
4. **Environment**で以下をすべてチェック:
   - ☑ Production
   - ☑ Preview
   - ☑ Development
5. 「**Save**」または「**Add**」ボタンをクリック
6. 画面に2つの環境変数が表示されることを確認

#### ③ 3つ目の環境変数: OPENAI_API_KEY

1. 再度「**Add New**」または「**+ Add**」ボタンをクリック
2. **Key**欄に以下を入力:
   ```
   OPENAI_API_KEY
   ```
3. **Value**欄に以下を入力（長い文字列なので注意）:
   ```
   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
   ```
4. **Environment**で以下をすべてチェック:
   - ☑ Production
   - ☑ Preview
   - ☑ Development
5. 「**Save**」または「**Add**」ボタンをクリック
6. 画面に3つの環境変数がすべて表示されることを確認

## よくある間違いと解決方法

### ❌ 間違い1: Key名にスペースが含まれている
- ✅ 正しい: `NEXT_PUBLIC_SUPABASE_URL`
- ❌ 間違い: `NEXT_PUBLIC_SUPABASE_URL `（末尾にスペース）

### ❌ 間違い2: Valueの前後にスペースや改行が含まれている
- ✅ 正しい: `https://fzhrybiuspoxovctdogb.supabase.co`
- ❌ 間違い: ` https://fzhrybiuspoxovctdogb.supabase.co `（前後にスペース）

### ❌ 間違い3: Environmentの選択を忘れている
- ✅ 必ず Production, Preview, Development の**すべて**にチェックを入れる

### ❌ 間違い4: Saveボタンを押していない
- ✅ 「Save」または「Add」ボタンをクリックして保存する

### ❌ 間違い5: ブラウザの自動入力が干渉している
- ✅ ブラウザの自動入力機能を無効にして、手動で入力する

## 確認方法

環境変数が正しく追加されたか確認：

1. Environment Variablesページに戻る
2. 以下の3つが表示されているか確認:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
3. 各環境変数の右側に「Production」「Preview」「Development」の3つすべてが表示されているか確認

## 再デプロイ

環境変数を追加した後、**必ず再デプロイ**が必要です：

1. プロジェクトページの「**Deployments**」タブをクリック
2. 最新のデプロイメントの右側にある「**⋯**」（三点メニュー）をクリック
3. 「**Redeploy**」を選択
4. 確認ダイアログで「**Redeploy**」をクリック

## それでも解決しない場合

1. **ブラウザをリフレッシュ**: ページをリロード（Cmd+R / Ctrl+R）
2. **別のブラウザで試す**: Chrome、Firefox、Safariなど
3. **シークレットモードで試す**: ブラウザの拡張機能が干渉している可能性
4. **Vercelのサポートに問い合わせ**: https://vercel.com/support











