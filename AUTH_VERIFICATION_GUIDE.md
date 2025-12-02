# 認証機能の動作確認ガイド

Vercelでデプロイしている場合の確認方法を説明します。

---

## 🎯 確認方法の選択

### 方法1: Vercel本番環境で確認（推奨）

既にVercelにデプロイしている場合、本番環境で直接確認できます。

#### 1-1. 最新のコードをデプロイ

```bash
# 変更をコミット・プッシュ
git add -A
git commit -m "認証機能の実装"
git push origin main
```

Vercelは自動的にデプロイを開始します（通常1-2分）。

#### 1-2. Vercelの本番URLにアクセス

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **「Deployments」** タブで最新のデプロイを確認
4. デプロイが完了したら、**本番URL**（例: `https://rikkyo-ml5epsnw7-takus-projects-509b7512.vercel.app`）にアクセス

#### 1-3. ログインページにアクセス

- 本番URLにアクセスすると、自動的に `/login` にリダイレクトされます
- または、直接 `https://your-app.vercel.app/login` にアクセス

#### 1-4. ログインのテスト

1. ステップ2で作成したユーザーのメールアドレスとパスワードを入力
2. **「ログイン」** ボタンをクリック
3. ログインが成功すると、トップページにリダイレクトされます

---

### 方法2: ローカル環境で確認（開発用）

開発中の動作確認やデバッグには、ローカル環境が便利です。

#### 2-1. 開発サーバーの起動

```bash
cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"
npm run dev
```

#### 2-2. ローカルでアクセス

- **http://localhost:3000** にアクセス
- 自動的に `/login` にリダイレクトされます

#### 2-3. ローカル環境のメリット

- ✅ 高速なフィードバック（ホットリロード）
- ✅ デバッグが容易（ブラウザの開発者ツール）
- ✅ エラーメッセージが詳細
- ✅ 本番環境に影響を与えない

---

## 📋 確認手順（共通）

### ステップ1: Supabaseでのマイグレーション実行（必須）

**重要**: 本番環境でも動作させるには、Supabaseでマイグレーションを実行する必要があります。

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. **SQL Editor** を開く
3. `migrations/create_auth_tables_safe.sql` の内容をコピー
4. SQL Editorに貼り付けて実行

### ステップ2: 初回ユーザーの作成（必須）

1. Supabase Dashboard > **Authentication** > **Users**
2. **「Add user」** をクリック
3. メールアドレスとパスワードを設定
4. **「Auto Confirm User」** にチェック
5. **「Create user」** をクリック

### ステップ3: ユーザープロフィールの設定（必須）

1. 作成したユーザーの **UUID** をコピー
2. SQL Editorで以下を実行（`YOUR_USER_UUID` と `your-email@example.com` を実際の値に置き換え）：

```sql
INSERT INTO public.user_profiles (id, email, name, role)
VALUES (
  'YOUR_USER_UUID',
  'your-email@example.com',
  'Administrator',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
```

### ステップ4: Vercelの環境変数確認

Vercel Dashboard > **Settings** > **Environment Variables** で以下が設定されていることを確認：

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `OPENAI_API_KEY`

---

## 🔍 動作確認チェックリスト

### ログイン機能

- [ ] ログインページが表示される
- [ ] メールアドレスとパスワードを入力できる
- [ ] ログインボタンをクリックできる
- [ ] ログインが成功する（正しい認証情報の場合）
- [ ] エラーメッセージが表示される（間違った認証情報の場合）

### ナビゲーションバー

- [ ] ログイン後、ユーザー名とロールが表示される
- [ ] **「ログアウト」** ボタンが表示される
- [ ] 管理者の場合、「📚 文書一覧」「📤 文書アップロード」が表示される
- [ ] 一般ユーザーの場合、管理者リンクが表示されない

### 権限チェック

- [ ] 管理者でログインした場合、`/admin/documents` にアクセスできる
- [ ] 管理者でログインした場合、`/admin/upload` にアクセスできる
- [ ] 一般ユーザーでログインした場合、`/admin/documents` にアクセスできない（リダイレクトまたはエラー）
- [ ] 一般ユーザーでログインした場合、`/ask` にアクセスできる

### ログアウト機能

- [ ] **「ログアウト」** ボタンをクリックできる
- [ ] ログアウト後、`/login` にリダイレクトされる
- [ ] ログアウト後、管理者ページにアクセスできない

---

## ⚠️ よくある問題

### 問題1: ログインできない（本番環境）

**原因**: 
- Supabaseのマイグレーションが実行されていない
- ユーザーが作成されていない
- `user_profiles` テーブルにプロフィールが存在しない

**対処法**:
1. Supabase Dashboardでマイグレーションを実行
2. ユーザーを作成
3. `user_profiles` にプロフィールを追加

### 問題2: 403エラー（権限エラー）

**原因**: 
- `user_profiles` テーブルの `role` が `user` になっている

**対処法**:
```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 問題3: 環境変数が読み込まれない（本番環境）

**原因**: 
- Vercelの環境変数が設定されていない
- 環境変数を追加した後、再デプロイしていない

**対処法**:
1. Vercel Dashboard > Settings > Environment Variables で確認
2. 環境変数を追加した後、**「Redeploy」** を実行

---

## 🚀 推奨フロー

1. **Supabaseでマイグレーション実行**（必須）
2. **初回ユーザーを作成**（必須）
3. **Vercelに最新コードをプッシュ**（自動デプロイ）
4. **本番URLで動作確認**
5. 問題があれば、ローカル環境でデバッグ

---

**質問や問題が発生した場合は、エラーメッセージと一緒にご連絡ください。**

