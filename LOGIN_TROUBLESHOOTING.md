# ログインエラー解決ガイド

「Invalid login credentials」または「メールアドレスまたはパスワードが正しくありません」というエラーが表示される場合の対処法です。

## 🔍 確認すべき項目

### 1. Supabaseでユーザーが作成されているか確認

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 左サイドバーから **「Authentication」** > **「Users」** をクリック
4. ユーザー一覧に `suzutaku6311@gmail.com` が存在するか確認

**ユーザーが存在しない場合**:
- ステップ2に進んでユーザーを作成してください

**ユーザーが存在する場合**:
- ステップ3に進んでパスワードを確認してください

---

### 2. ユーザーを作成する（存在しない場合）

#### 方法A: Supabase Dashboardから作成

1. Supabase Dashboard > **「Authentication」** > **「Users」** を開く
2. **「Add user」** または **「Create new user」** をクリック
3. 以下の情報を入力：
   - **Email**: `suzutaku6311@gmail.com`
   - **Password**: 強力なパスワードを設定（8文字以上、大文字・小文字・数字を含む）
   - **Auto Confirm User**: ✅ チェックを入れる（メール確認をスキップ）
4. **「Create user」** をクリック

#### 方法B: SQLで作成（上級者向け）

Supabase SQL Editorで以下を実行：

```sql
-- ユーザーを作成（Supabase Authを使用）
-- 注意: この方法はSupabase CLIまたはAdmin APIが必要です
-- 通常はDashboardから作成することを推奨します
```

---

### 3. パスワードをリセットする（パスワードが不明な場合）

1. Supabase Dashboard > **「Authentication」** > **「Users」** を開く
2. 対象ユーザー（`suzutaku6311@gmail.com`）をクリック
3. **「Reset Password」** または **「Send Password Reset Email」** をクリック
4. ユーザーのメールアドレスにパスワードリセットメールが送信されます
5. メール内のリンクから新しいパスワードを設定

**または、直接パスワードを変更**:
1. ユーザー詳細画面で **「Change Password」** をクリック
2. 新しいパスワードを入力して保存

---

### 4. user_profilesテーブルにプロフィールが作成されているか確認

1. Supabase Dashboard > **「SQL Editor」** を開く
2. 以下のSQLを実行：

```sql
-- ユーザープロフィールを確認
SELECT * FROM public.user_profiles 
WHERE email = 'suzutaku6311@gmail.com';
```

**結果が空の場合**:
- ステップ5に進んでプロフィールを作成してください

**結果が存在する場合**:
- ステップ6に進んでマイグレーションを確認してください

---

### 5. user_profilesテーブルにプロフィールを作成する

1. Supabase Dashboard > **「Authentication」** > **「Users」** を開く
2. ユーザー（`suzutaku6311@gmail.com`）の **「UUID」** をコピー
3. Supabase SQL Editorで以下を実行（`YOUR_USER_UUID` を実際のUUIDに置き換え）：

```sql
-- ユーザープロフィールを作成
INSERT INTO public.user_profiles (id, email, name, role)
VALUES (
  'YOUR_USER_UUID',  -- ここにコピーしたUUIDを貼り付け
  'suzutaku6311@gmail.com',
  'User',  -- 表示名（任意）
  'admin'  -- ロール: 'user', 'admin', 'super_admin'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
```

**例**:
```sql
INSERT INTO public.user_profiles (id, email, name, role)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'suzutaku6311@gmail.com',
  'User',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
```

---

### 6. マイグレーションが実行されているか確認

1. Supabase Dashboard > **「SQL Editor」** を開く
2. 以下のSQLを実行してテーブルの存在を確認：

```sql
-- user_profilesテーブルの存在確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
);
```

**結果が `false` の場合**:
- `migrations/create_auth_tables_safe.sql` を実行してください
- 実行方法: Supabase Dashboard > **「SQL Editor」** > ファイルの内容をコピー&ペースト > **「Run」** をクリック

**結果が `true` の場合**:
- ステップ7に進んで環境変数を確認してください

---

### 7. 環境変数が正しく設定されているか確認

#### ローカル環境（開発時）

プロジェクトルートの `.env.local` ファイルを確認：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Vercel環境（本番環境）

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **「Settings」** > **「Environment Variables」** を開く
4. 以下の環境変数が設定されているか確認：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**環境変数が設定されていない場合**:
1. Supabase Dashboard > **「Settings」** > **「API」** を開く
2. **「Project URL」** をコピー → Vercelの `NEXT_PUBLIC_SUPABASE_URL` に設定
3. **「anon public」** キーをコピー → Vercelの `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定
4. Vercelで再デプロイ（自動的に再デプロイされる場合もあります）

---

## 🧪 テスト手順

### 1. ローカル環境でテスト

```bash
cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"
npm run dev
```

1. ブラウザで `http://localhost:3000/login` にアクセス
2. メールアドレスとパスワードを入力
3. ログインを試行

### 2. 本番環境（Vercel）でテスト

1. VercelのデプロイURLにアクセス（例: `https://your-project.vercel.app/login`）
2. メールアドレスとパスワードを入力
3. ログインを試行

---

## 📝 よくある問題と解決法

### 問題1: 「ユーザーが見つかりません」

**原因**: Supabase Authenticationにユーザーが作成されていない

**解決法**: ステップ2を実行してユーザーを作成

---

### 問題2: 「メールアドレスまたはパスワードが正しくありません」

**原因**: 
- パスワードが間違っている
- メールアドレスの大文字・小文字が一致していない

**解決法**: 
- ステップ3を実行してパスワードをリセット
- メールアドレスを正確に入力（大文字・小文字に注意）

---

### 問題3: 「プロフィール取得エラー」がログに表示される

**原因**: `user_profiles` テーブルにプロフィールが存在しない

**解決法**: ステップ5を実行してプロフィールを作成

---

### 問題4: ログインは成功するが、権限エラーが発生する

**原因**: `user_profiles` テーブルの `role` が `user` になっている（管理者権限が必要なページにアクセスできない）

**解決法**: ステップ5を実行して `role` を `admin` または `super_admin` に変更

---

## 🔗 関連ドキュメント

- [AUTH_SETUP_GUIDE.md](./AUTH_SETUP_GUIDE.md) - 認証機能のセットアップガイド
- [AUTH_VERIFICATION_GUIDE.md](./AUTH_VERIFICATION_GUIDE.md) - 認証機能の検証ガイド

---

## 💡 まだ解決しない場合

1. **ブラウザのコンソールを確認**
   - 開発者ツール（F12）を開く
   - 「Console」タブでエラーメッセージを確認

2. **Vercelのログを確認**
   - Vercel Dashboard > プロジェクト > **「Deployments」** > 最新のデプロイ > **「Functions」** タブ
   - `/api/auth/login` のログを確認

3. **Supabaseのログを確認**
   - Supabase Dashboard > **「Logs」** > **「API Logs」** を確認

4. **環境変数を再確認**
   - ローカルとVercelの両方で環境変数が正しく設定されているか確認

