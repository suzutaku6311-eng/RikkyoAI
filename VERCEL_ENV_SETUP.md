# Vercel環境変数設定手順

## エラーが発生した場合

「Unexpected token 'R', "Request En"... is not valid JSON」というエラーが表示される場合、Vercelの環境変数が設定されていません。

## 設定手順

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard にアクセス
   - プロジェクト「RikkyoAI」を選択（クリックして開く）

2. **環境変数設定画面を開く**
   
   方法1: Settingsタブから
   - プロジェクトページの上部にあるタブメニューで「**Settings**」をクリック
   - 左側のサイドバーメニュー（またはページ内）から「**Environment Variables**」を探してクリック
   
   方法2: 直接URLでアクセス
   - プロジェクトを選択した状態で、以下のURLに直接アクセス：
   - `https://vercel.com/[あなたのプロジェクト名]/settings/environment-variables`
   
   方法3: 検索で探す
   - Settingsページ内で「Environment」や「Variables」で検索
   - または、ページをスクロールして「Environment Variables」セクションを探す

3. **以下の3つの環境変数を追加**

   ### ① NEXT_PUBLIC_SUPABASE_URL
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: あなたのSupabase URL（例: `https://xxxxx.supabase.co`）
   - **Environment**: Production, Preview, Development すべてにチェック ✅

   ### ② NEXT_PUBLIC_SUPABASE_ANON_KEY
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: あなたのSupabase匿名キー（`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`で始まる文字列）
   - **Environment**: Production, Preview, Development すべてにチェック ✅

   ### ③ OPENAI_API_KEY
   - **Key**: `OPENAI_API_KEY`
   - **Value**: あなたのOpenAI APIキー（`sk-proj-...`で始まる文字列）
   - **Environment**: Production, Preview, Development すべてにチェック ✅

4. **環境変数の値を確認**
   - ローカルの`.env.local`ファイルから値を取得してください
   - または、Supabase Dashboard → Project Settings → API から取得

5. **再デプロイ**
   - 環境変数を追加した後、必ず「Deployments」タブから「Redeploy」を実行してください
   - または、GitHubに新しいコミットをプッシュすると自動的に再デプロイされます

## 確認方法

環境変数が正しく設定されているか確認するには：

1. Vercelダッシュボード → 「Deployments」タブ
2. 最新のデプロイメントをクリック
3. 「Build Logs」を確認
4. エラーメッセージに「Missing ... environment variable」が表示されていないか確認

## トラブルシューティング

### 環境変数を追加してもエラーが続く場合

1. **再デプロイを実行**: 環境変数を追加した後、必ず再デプロイが必要です
2. **環境変数の名前を確認**: `NEXT_PUBLIC_`プレフィックスが必要な変数は正しく設定されているか確認
3. **値のコピペミスを確認**: スペースや改行が含まれていないか確認
4. **Vercelのログを確認**: 「Deployments」→「Functions」タブでAPIログを確認

