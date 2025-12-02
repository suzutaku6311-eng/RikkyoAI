# 管理者画面アクセス問題のデバッグガイド

管理者としてログインしても、文書アップロードと文書一覧の画面が見られない場合のトラブルシューティングガイドです。

## 🔍 確認ステップ

### ステップ1: ブラウザのコンソールで確認

1. ブラウザの開発者ツールを開く（F12）
2. **「Console」** タブを開く
3. ログイン後に以下のようなログが表示されるか確認：

```
[Auth] ログイン成功、ユーザー情報を設定: { id: '...', email: '...', role: 'admin', ... }
[Auth] ユーザー情報を取得: { id: '...', email: '...', role: 'admin', ... }
[Middleware] 管理者権限チェック: { userId: '...', role: 'admin', isAdmin: true, ... }
```

**問題がある場合のログ例**:
```
[Auth] ユーザー情報を取得: { role: 'user', ... }  // ← roleが'user'になっている
[Middleware] 管理者権限がありません。ホームにリダイレクトします。
```

---

### ステップ2: Supabaseでユーザーのroleを確認

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. **「SQL Editor」** を開く
4. 以下を実行（メールアドレスを実際のメールアドレスに置き換え）：

```sql
-- ユーザーのroleを確認
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at,
  updated_at
FROM public.user_profiles
WHERE email = 'suzutaku6311@gmail.com';
```

**期待される結果**:
- `role` が `'admin'` または `'super_admin'` になっている

**問題がある場合**:
- `role` が `'user'` になっている → ステップ3に進む
- 結果が空（プロフィールが存在しない） → ステップ4に進む

---

### ステップ3: roleを'admin'に変更

Supabase SQL Editorで以下を実行（メールアドレスを実際のメールアドレスに置き換え）：

```sql
-- roleを'admin'に変更
UPDATE public.user_profiles
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'suzutaku6311@gmail.com';

-- 変更を確認
SELECT id, email, name, role, is_active
FROM public.user_profiles
WHERE email = 'suzutaku6311@gmail.com';
```

---

### ステップ4: プロフィールが存在しない場合

1. Supabase Dashboard > **「Authentication」** > **「Users」** を開く
2. メールアドレス `suzutaku6311@gmail.com` のユーザーの **「UUID」** をコピー
3. Supabase SQL Editorで以下を実行（`YOUR_USER_UUID` を実際のUUIDに置き換え）：

```sql
-- ユーザープロフィールを作成（role = 'admin'）
INSERT INTO public.user_profiles (id, email, name, role, is_active)
VALUES (
  'YOUR_USER_UUID',  -- ステップ2で取得したUUID
  'suzutaku6311@gmail.com',
  'Admin User',  -- 表示名（任意）
  'admin',  -- ロール: 'admin' または 'super_admin'
  true  -- is_active
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

---

### ステップ5: ブラウザのキャッシュとCookieをクリア

1. ブラウザの開発者ツールを開く（F12）
2. **「Application」** タブ（Chrome）または **「Storage」** タブ（Firefox）を開く
3. **「Cookies」** を選択
4. サイトのCookieをすべて削除
5. **「Local Storage」** と **「Session Storage」** もクリア
6. ページをリロード（Ctrl+Shift+R または Cmd+Shift+R）

---

### ステップ6: 再度ログイン

1. ログアウト
2. 再度ログイン
3. ブラウザのコンソールで以下を確認：

```
[Auth] ログイン成功、ユーザー情報を設定: { role: 'admin', ... }
[Auth] ユーザー情報を取得: { role: 'admin', ... }
```

4. ナビゲーションバーに「文書管理」「アップロード」のリンクが表示されるか確認

---

## 🐛 よくある問題

### 問題1: ログイン後も`role`が`'user'`のまま

**原因**: Supabaseの`user_profiles`テーブルで`role`が正しく設定されていない

**解決法**: ステップ3を実行して`role`を`'admin'`に変更

---

### 問題2: プロフィールが存在しない

**原因**: `user_profiles`テーブルにプロフィールが作成されていない

**解決法**: ステップ4を実行してプロフィールを作成

---

### 問題3: ログイン後、すぐにホームにリダイレクトされる

**原因**: middlewareで管理者権限チェックが失敗している

**確認方法**: 
- ブラウザのコンソールで`[Middleware] 管理者権限チェック:`のログを確認
- `isAdmin: false`になっている場合は、ステップ3を実行

---

### 問題4: ナビゲーションバーに管理者リンクが表示されない

**原因**: フロントエンドの`isAdmin`が`false`になっている

**確認方法**:
- ブラウザのコンソールで`[Auth] ユーザー情報を取得:`のログを確認
- `role`が`'admin'`または`'super_admin'`になっているか確認

---

## 📋 確認チェックリスト

- [ ] Supabaseでユーザーの`role`が`'admin'`または`'super_admin'`になっている
- [ ] ブラウザのキャッシュとCookieをクリアした
- [ ] ログアウトして再度ログインした
- [ ] ブラウザのコンソールで`role: 'admin'`が表示される
- [ ] ナビゲーションバーに「文書管理」「アップロード」のリンクが表示される
- [ ] `/admin/documents`にアクセスできる
- [ ] `/admin/upload`にアクセスできる

---

## 🔗 関連ドキュメント

- [ADMIN_ROLE_SETUP.md](./ADMIN_ROLE_SETUP.md) - 管理者権限の設定ガイド
- [AUTH_SETUP_GUIDE.md](./AUTH_SETUP_GUIDE.md) - 認証機能のセットアップガイド

