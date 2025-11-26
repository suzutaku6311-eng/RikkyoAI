# Vercel環境変数設定手順（詳細版）

## エラーが発生した場合

「Unexpected token 'R', "Request En"... is not valid JSON」というエラーが表示される場合、Vercelの環境変数が設定されていません。

## ステップバイステップ手順

### ステップ1: Vercelダッシュボードにアクセス

1. ブラウザで https://vercel.com/dashboard を開く
2. GitHubアカウントでログイン（必要に応じて）
3. プロジェクト一覧から「**RikkyoAI**」を探してクリック

### ステップ2: Settingsタブを開く

プロジェクトページの上部にタブメニューが表示されます：
- Overview
- Deployments
- **Settings** ← これをクリック
- Analytics
- など

### ステップ3: Environment Variablesセクションを見つける

Settingsページを開いたら、以下のいずれかの方法で「Environment Variables」を見つけます：

#### 方法A: 左側のサイドバーから
- Settingsページの左側にメニューが表示されている場合
- 「Environment Variables」という項目をクリック

#### 方法B: ページ内をスクロール
- Settingsページを下にスクロール
- 「Environment Variables」というセクションを探す

#### 方法C: 検索機能を使う
- ブラウザの検索機能（Cmd+F / Ctrl+F）で「Environment」と検索
- 「Environment Variables」がハイライトされます

#### 方法D: 直接URLでアクセス
プロジェクト名が「rikkyo-ai」の場合：
```
https://vercel.com/rikkyo-ai/settings/environment-variables
```

プロジェクト名が「RikkyoAI」の場合：
```
https://vercel.com/RikkyoAI/settings/environment-variables
```

### ステップ4: 環境変数を追加

「Environment Variables」セクションが見つかったら：

1. 「**Add New**」または「**+ Add**」ボタンをクリック

2. 以下の3つの環境変数を順番に追加：

   #### ① NEXT_PUBLIC_SUPABASE_URL
   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://fzhrybiuspoxovctdogb.supabase.co
   Environment: ✅ Production ✅ Preview ✅ Development
   ```
   - 「Add」または「Save」をクリック

   #### ② NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6aHJ5Yml1c3BveG92Y3Rkb2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDUwODksImV4cCI6MjA3OTU4MTA4OX0.JKWOz2xG3aokS1qMPrU1LlFFFLGamX8rHq_Xft9ForA
   Environment: ✅ Production ✅ Preview ✅ Development
   ```
   - 「Add」または「Save」をクリック

   #### ③ OPENAI_API_KEY
   ```
   Key: OPENAI_API_KEY
   Value: YOUR_OPENAI_API_KEY_HERE
   Environment: ✅ Production ✅ Preview ✅ Development
   ```
   - 「Add」または「Save」をクリック

### ステップ5: 再デプロイ

環境変数を追加した後、**必ず再デプロイが必要**です：

1. プロジェクトページの上部タブで「**Deployments**」をクリック
2. 最新のデプロイメントの右側にある「**⋯**」（三点メニュー）をクリック
3. 「**Redeploy**」を選択
4. 「Redeploy」ボタンをクリック

または、GitHubに新しいコミットをプッシュすると自動的に再デプロイされます。

## 確認方法

環境変数が正しく設定されているか確認：

1. Settings → Environment Variables に戻る
2. 追加した3つの環境変数が表示されているか確認
3. 各環境変数の「Environment」列に ✅ が3つ（Production, Preview, Development）表示されているか確認

## トラブルシューティング

### 「Environment Variables」が見つからない場合

1. **プロジェクトの権限を確認**
   - プロジェクトの所有者または管理者権限が必要です
   - チームメンバーの場合、権限が不足している可能性があります

2. **別のブラウザで試す**
   - ブラウザのキャッシュが原因の可能性があります
   - シークレットモードで試してみてください

3. **Vercelのサポートに問い合わせ**
   - https://vercel.com/support から問い合わせ

### 環境変数を追加してもエラーが続く場合

1. **再デプロイを実行**: 環境変数を追加した後、必ず再デプロイが必要です
2. **環境変数の名前を確認**: `NEXT_PUBLIC_`プレフィックスが必要な変数は正しく設定されているか確認
3. **値のコピペミスを確認**: スペースや改行が含まれていないか確認
4. **Vercelのログを確認**: 「Deployments」→ 最新のデプロイメント → 「Functions」タブでAPIログを確認

