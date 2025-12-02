# 管理者権限のクイック修正ガイド

ログイン後、`role`が`"user"`のままになっている場合の修正方法です。

## 🔧 修正手順（5分で完了）

### ステップ1: Supabase Dashboardを開く

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択

### ステップ2: SQL Editorを開く

1. 左サイドバーから **「SQL Editor」** をクリック
2. **「New query」** をクリック

### ステップ3: 以下のSQLを実行

メールアドレス `suzutaku6311@gmail.com` のユーザーの`role`を`'admin'`に変更：

```sql
-- 1. 現在のユーザー情報を確認
SELECT 
  id,
  email,
  name,
  role,
  is_active
FROM public.user_profiles
WHERE email = 'suzutaku6311@gmail.com';
```

**結果が空の場合**（プロフィールが存在しない）:

```sql
-- 2. ユーザーUUIDを取得
SELECT id, email 
FROM auth.users 
WHERE email = 'suzutaku6311@gmail.com';
```

上記で取得したUUIDを使って、以下を実行：

```sql
-- 3. プロフィールを作成（role = 'admin'）
-- YOUR_USER_UUID を上記で取得したUUIDに置き換えてください
INSERT INTO public.user_profiles (id, email, name, role, is_active)
VALUES (
  'YOUR_USER_UUID',  -- ここにUUIDを貼り付け
  'suzutaku6311@gmail.com',
  'Admin User',
  'admin',
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = 'admin',  -- 管理者権限に設定
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

**結果が存在する場合**（プロフィールが存在する）:

```sql
-- 4. roleを'admin'に変更
UPDATE public.user_profiles
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'suzutaku6311@gmail.com';

-- 5. 変更を確認
SELECT id, email, name, role, is_active
FROM public.user_profiles
WHERE email = 'suzutaku6311@gmail.com';
```

**期待される結果**:
```
id: 45dde3ed-7144-48f5-b810-99a5cd7357b2
email: suzutaku6311@gmail.com
name: Admin User
role: admin  ← これが'admin'になっていることを確認
is_active: true
```

### ステップ4: ブラウザで確認

1. **ブラウザのCookieをクリア**（設定から削除）
2. **ページをリロード**（Ctrl+Shift+R / Cmd+Shift+R）
3. **再度ログイン**
4. **ブラウザのコンソール（F12）で以下を確認**：
   ```
   [Auth] ログイン成功、ユーザー情報を設定: { role: 'admin', ... }
   ```
5. **ナビゲーションバーに「文書管理」「アップロード」のリンクが表示されることを確認**

---

## 🐛 トラブルシューティング

### 問題1: SQL実行時にエラーが発生する

**エラー**: `permission denied` または `relation does not exist`

**解決法**:
- `user_profiles`テーブルが存在するか確認
- `migrations/create_auth_tables_safe.sql` を実行していない場合は実行してください

### 問題2: プロフィールが存在しない

**解決法**: ステップ3の「結果が空の場合」の手順を実行

### 問題3: ログイン後も`role`が`'user'`のまま

**確認事項**:
1. SQLが正しく実行されたか確認（ステップ3の「変更を確認」を実行）
2. ブラウザのCookieをクリアしたか確認
3. ログアウトして再度ログインしたか確認

---

## 📋 確認チェックリスト

- [ ] Supabase SQL Editorで`role`が`'admin'`になっている
- [ ] ブラウザのCookieをクリアした
- [ ] ログアウトして再度ログインした
- [ ] ブラウザのコンソールで`role: 'admin'`が表示される
- [ ] ナビゲーションバーに「文書管理」「アップロード」のリンクが表示される
- [ ] `/admin/documents`にアクセスできる
- [ ] `/admin/upload`にアクセスできる

---

## 🔗 関連ドキュメント

- [ADMIN_ROLE_SETUP.md](./ADMIN_ROLE_SETUP.md) - 詳細な管理者権限設定ガイド
- [ADMIN_ACCESS_DEBUG.md](./ADMIN_ACCESS_DEBUG.md) - 管理者画面アクセス問題のデバッグガイド

