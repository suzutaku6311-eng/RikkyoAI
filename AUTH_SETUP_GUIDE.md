# 認証機能セットアップガイド

このガイドでは、実装した認証機能を実際に動作させるための手順を詳しく説明します。

---

## 📋 前提条件

- Supabaseプロジェクトが既に作成されていること
- Supabase Dashboardにアクセスできること
- 開発環境（ローカル）で動作確認できること

---

## ステップ1: Supabaseでのデータベースマイグレーション実行

### 1-1. Supabase Dashboardにアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択

### 1-2. SQL Editorを開く

1. 左サイドバーから **「SQL Editor」** をクリック
2. **「New query」** をクリックして新しいクエリを作成

### 1-3. マイグレーションファイルを実行

**⚠️ 重要**: Supabase SQL Editorで警告が表示される場合がありますが、問題ありません。

1. プロジェクト内の `migrations/create_auth_tables_safe.sql` ファイルを開く（安全版）
   - または `migrations/create_auth_tables.sql` を使用（元のバージョン）
2. ファイルの内容をすべてコピー
3. Supabase SQL Editorに貼り付け
4. 警告が表示された場合:
   - **「Query has destructive operation」** という警告が表示されることがあります
   - これは `DROP TRIGGER` 文が含まれているためです
   - `IF EXISTS` が付いているため、既存のトリガーがない場合は何もしません
   - **安全ですので、そのまま実行して問題ありません**
5. **「Run」** ボタンをクリック（または `Cmd+Enter` / `Ctrl+Enter`）

**安全版について**:
- `create_auth_tables_safe.sql` は既存のトリガーを削除しません（より安全）
- 初回実行時はどちらを使用しても問題ありません
- 既に実行済みの場合は、安全版を使用することを推奨します

### 1-4. 実行結果の確認

- ✅ 成功した場合: 「Success. No rows returned」または類似のメッセージが表示されます
- ❌ エラーが発生した場合: エラーメッセージを確認してください

**よくあるエラーと対処法**:
- `relation "auth.users" does not exist`: Supabase Authが有効になっていない可能性があります。Supabase Dashboard > Authentication で確認してください
- `permission denied`: 適切な権限で実行されているか確認してください

---

## ステップ2: Supabase Authの設定確認

### 2-1. Authenticationが有効になっているか確認

1. Supabase Dashboard > **「Authentication」** をクリック
2. **「Providers」** タブを確認
3. **「Email」** プロバイダーが有効になっていることを確認（デフォルトで有効）

### 2-2. メール認証の設定（オプション）

1. **「Authentication」** > **「Settings」** を開く
2. **「Email Auth」** セクションで設定を確認
3. 開発環境では、**「Enable email confirmations」** を無効にしても構いません（本番環境では有効に推奨）

---

## ステップ3: 初回ユーザーの作成

### 方法A: Supabase Dashboardから作成（推奨）

1. Supabase Dashboard > **「Authentication」** > **「Users」** を開く
2. **「Add user」** または **「Create new user」** をクリック
3. 以下の情報を入力：
   - **Email**: `admin@example.com`（実際のメールアドレス）
   - **Password**: 強力なパスワード（8文字以上、大文字・小文字・数字を含む）
   - **Auto Confirm User**: ✅ チェック（メール認証をスキップ）
4. **「Create user」** をクリック

### 方法B: SQLで直接作成（上級者向け）

Supabase SQL Editorで以下を実行：

```sql
-- 注意: この方法はSupabase Authの内部APIを使用するため、推奨されません
-- 方法Aを使用することを推奨します
```

### 3-2. ユーザープロフィールの設定

ユーザーを作成した後、`user_profiles` テーブルにプロフィールを追加する必要があります。

1. Supabase Dashboard > **「Authentication」** > **「Users」** で作成したユーザーを確認
2. ユーザーの **「UUID」** をコピー
3. Supabase SQL Editorで以下を実行（`YOUR_USER_UUID` を実際のUUIDに置き換え）：

```sql
-- 管理者ユーザーのプロフィールを作成
INSERT INTO public.user_profiles (id, email, name, role)
VALUES (
  'YOUR_USER_UUID',  -- ここにコピーしたUUIDを貼り付け
  'admin@example.com',  -- 作成したユーザーのメールアドレス
  'Admin User',  -- 表示名
  'admin'  -- ロール: 'user', 'admin', 'super_admin' のいずれか
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
  'admin@rikkyo.ac.uk',
  'Administrator',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role;
```

---

## ステップ4: 環境変数の確認

### 4-1. ローカル環境（.env.local）

プロジェクトルートの `.env.local` ファイルに以下が設定されていることを確認：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI設定（既存）
OPENAI_API_KEY=your-openai-api-key-here
```

### 4-2. Supabaseの認証情報を取得

1. Supabase Dashboard > **「Settings」** > **「API」** を開く
2. **「Project URL」** をコピー → `NEXT_PUBLIC_SUPABASE_URL` に設定
3. **「anon public」** キーをコピー → `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定

### 4-3. Vercel環境変数（本番環境）

Vercelにデプロイしている場合、Vercel Dashboardでも環境変数を設定：

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **「Settings」** > **「Environment Variables」** を開く
4. 以下の環境変数を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`（既に設定済みの場合）

---

## ステップ5: 動作確認

### 5-1. 開発サーバーの起動

```bash
cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"
npm run dev
```

### 5-2. ログインページにアクセス

1. ブラウザで `http://localhost:3000` にアクセス
2. 自動的に `/login` にリダイレクトされるか、手動で `/login` にアクセス
3. ログイン画面が表示されることを確認

### 5-3. ログインのテスト

1. ステップ3で作成したユーザーのメールアドレスとパスワードを入力
2. **「ログイン」** ボタンをクリック
3. ログインが成功すると、トップページ（`/`）にリダイレクトされる

### 5-4. 権限の確認

#### 管理者ユーザーでログインした場合

- ✅ `/` - トップページ（アクセス可能）
- ✅ `/ask` - 文書検索（アクセス可能）
- ✅ `/admin/documents` - 文書一覧（アクセス可能）
- ✅ `/admin/upload` - 文書アップロード（アクセス可能）

#### 一般ユーザーでログインした場合

- ✅ `/` - トップページ（アクセス可能）
- ✅ `/ask` - 文書検索（アクセス可能）
- ❌ `/admin/documents` - 管理者権限が必要（リダイレクトまたはエラー）
- ❌ `/admin/upload` - 管理者権限が必要（リダイレクトまたはエラー）

### 5-5. ナビゲーションバーの確認

ログイン後、ナビゲーションバーに以下が表示されることを確認：

- ユーザー名とロール（例: `Admin User (admin)`）
- **「ログアウト」** ボタン
- 管理者の場合: **「📚 文書一覧」**、**「📤 文書アップロード」** リンク

---

## ステップ6: トラブルシューティング

### 問題1: ログインできない

**症状**: ログインボタンをクリックしてもエラーが表示される

**確認事項**:
1. メールアドレスとパスワードが正しいか
2. Supabase Dashboard > Authentication > Users でユーザーが作成されているか
3. ブラウザのコンソール（F12）でエラーメッセージを確認
4. ターミナルのログでエラーメッセージを確認

**対処法**:
- パスワードをリセット: Supabase Dashboard > Authentication > Users > ユーザーを選択 > Reset Password

### 問題2: マイグレーションエラー

**症状**: SQL Editorでエラーが発生する

**確認事項**:
1. `migrations/create_auth_tables.sql` の内容が正しくコピーされているか
2. 既にテーブルが存在する場合は、`CREATE TABLE IF NOT EXISTS` を使用しているため、エラーは発生しません
3. RLSポリシーが既に存在する場合は、`CREATE POLICY` の前に `DROP POLICY IF EXISTS` を追加

**対処法**:
- エラーメッセージを確認して、該当する部分を修正
- 必要に応じて、テーブルを手動で削除してから再実行

### 問題3: 権限エラー（403 Forbidden）

**症状**: 管理者ページにアクセスできない

**確認事項**:
1. `user_profiles` テーブルにユーザーのプロフィールが作成されているか
2. `role` フィールドが `admin` または `super_admin` になっているか
3. Supabase SQL Editorで以下を実行して確認：

```sql
SELECT id, email, name, role, is_active
FROM public.user_profiles
WHERE email = 'your-email@example.com';
```

**対処法**:
- `role` が `user` の場合は、`admin` に更新：

```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 問題4: セッションが保持されない

**症状**: ログイン後、ページをリロードするとログアウトされる

**確認事項**:
1. ブラウザのCookieが有効になっているか
2. `middleware.ts` が正しく動作しているか
3. Supabaseのセッション設定を確認

**対処法**:
- ブラウザのCookieをクリアして再試行
- 開発サーバーを再起動

---

## ステップ7: 既存データの移行（オプション）

既存の文書データがある場合、`created_by` フィールドを設定することを推奨します。

### 7-1. 既存文書の `created_by` を設定

Supabase SQL Editorで以下を実行（`YOUR_ADMIN_USER_UUID` を管理者ユーザーのUUIDに置き換え）：

```sql
-- 既存の文書に管理者ユーザーを設定
UPDATE public.documents
SET created_by = 'YOUR_ADMIN_USER_UUID'
WHERE created_by IS NULL;
```

---

## ✅ 完了チェックリスト

- [ ] Supabaseでマイグレーションを実行
- [ ] 初回ユーザー（管理者）を作成
- [ ] `user_profiles` テーブルにプロフィールを追加
- [ ] 環境変数を確認・設定
- [ ] 開発サーバーを起動
- [ ] ログインが成功することを確認
- [ ] 管理者ページにアクセスできることを確認
- [ ] ナビゲーションバーにユーザー情報が表示されることを確認
- [ ] ログアウトが正常に動作することを確認

---

## 📚 参考資料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [AUTH_REQUIREMENTS.md](./AUTH_REQUIREMENTS.md) - 詳細な要件定義
- [AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md) - 実装サマリー

---

**質問や問題が発生した場合は、エラーメッセージと一緒にご連絡ください。**

