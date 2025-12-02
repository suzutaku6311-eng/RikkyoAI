# RLSポリシー修正ガイド

ログイン後に`role`が`'user'`のままになる問題は、RLS（Row Level Security）ポリシーが原因の可能性があります。

## 🔍 問題の原因

ログインAPIでプロフィールを取得する際、RLSポリシーによってブロックされている可能性があります。

## 🔧 修正手順

### ステップ1: Supabase Dashboardを開く

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択

### ステップ2: SQL Editorで以下を実行

```sql
-- RLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
```

### ステップ3: RLSポリシーを修正

以下のSQLを実行して、認証されたユーザーが自分のプロフィールを確実に取得できるようにします：

```sql
-- 既存のポリシーを削除（必要に応じて）
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- ユーザーは自分のプロフィールを確実に閲覧可能にする
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- 既存のポリシーを削除（必要に応じて）
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- ユーザーは自分のプロフィールを確実に更新可能にする
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### ステップ4: プロフィールの確認と修正

```sql
-- 1. 現在のプロフィールを確認
SELECT id, email, name, role, is_active
FROM public.user_profiles
WHERE email = 'suzutaku6311@gmail.com';

-- 2. roleを'admin'に設定（存在する場合）
UPDATE public.user_profiles
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'suzutaku6311@gmail.com';

-- 3. プロフィールが存在しない場合は作成
INSERT INTO public.user_profiles (id, email, name, role, is_active)
SELECT 
  id,
  email,
  split_part(email, '@', 1) as name,
  'admin' as role,
  true as is_active
FROM auth.users
WHERE email = 'suzutaku6311@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = 'admin',
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

### ステップ5: 確認

```sql
-- プロフィールが正しく設定されているか確認
SELECT id, email, name, role, is_active, created_at, updated_at
FROM public.user_profiles
WHERE email = 'suzutaku6311@gmail.com';
```

**期待される結果**:
- `role` が `'admin'` になっている
- `is_active` が `true` になっている

---

## 🐛 トラブルシューティング

### 問題1: RLSポリシーが適用されない

**確認事項**:
1. RLSが有効になっているか確認：
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'user_profiles';
   ```
   - `rowsecurity` が `true` になっている必要があります

2. RLSを有効化（必要に応じて）：
   ```sql
   ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
   ```

### 問題2: プロフィールが取得できない

**確認事項**:
1. プロフィールが存在するか確認（ステップ4を実行）
2. ユーザーIDが正しいか確認：
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'suzutaku6311@gmail.com';
   ```

### 問題3: ログイン後も`role`が`'user'`のまま

**確認事項**:
1. Vercelのログでプロフィール取得エラーを確認
2. ブラウザのCookieをクリア
3. ログアウトして再度ログイン

---

## 📋 確認チェックリスト

- [ ] RLSポリシーが正しく設定されている
- [ ] プロフィールが存在し、`role`が`'admin'`になっている
- [ ] ブラウザのCookieをクリアした
- [ ] ログアウトして再度ログインした
- [ ] ブラウザのコンソールで`role: 'admin'`が表示される
- [ ] ナビゲーションバーに「文書管理」「アップロード」のリンクが表示される

---

## 🔗 関連ドキュメント

- [QUICK_FIX_ADMIN_ROLE.md](./QUICK_FIX_ADMIN_ROLE.md) - クイック修正ガイド
- [ADMIN_ROLE_SETUP.md](./ADMIN_ROLE_SETUP.md) - 詳細な管理者権限設定ガイド

