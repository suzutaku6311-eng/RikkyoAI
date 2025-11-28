# 認証・認可機能 要件定義書

**バージョン**: 1.0  
**作成日**: 2024年11月28日  
**対象システム**: Rikkyo School in England Insight AI System

---

## 📋 目次

1. [現状の問題点](#現状の問題点)
2. [目的と背景](#目的と背景)
3. [機能要件](#機能要件)
4. [非機能要件](#非機能要件)
5. [認証方式の選択](#認証方式の選択)
6. [認可の仕組み](#認可の仕組み)
7. [データベース設計](#データベース設計)
8. [API設計](#api設計)
9. [UI設計](#ui設計)
10. [セキュリティ考慮事項](#セキュリティ考慮事項)
11. [実装の優先順位](#実装の優先順位)
12. [実装方針](#実装方針)

---

## 🚨 現状の問題点

### 1. アクセス制御の欠如

- **問題**: 現在、誰でもURLを知っていればシステムにアクセス可能
- **リスク**: 
  - 機密文書の漏洩
  - 不正な文書のアップロード
  - システムの悪用
  - データの改ざん

### 2. 権限管理の欠如

- **問題**: すべてのユーザーが同じ権限を持っている
- **リスク**:
  - 一般ユーザーが文書をアップロード・削除できる
  - 管理者機能への不正アクセス
  - 文書のダウンロード制御ができない

### 3. 監査ログの欠如

- **問題**: 誰が何をしたかの記録がない
- **リスク**:
  - セキュリティインシデントの追跡が困難
  - 責任の所在が不明確

---

## 🎯 目的と背景

### 目的

1. **組織内の人間のみがアクセス可能にする**
   - 認証機能により、許可されたユーザーのみがシステムにアクセスできるようにする

2. **権限に応じた機能制限**
   - 一般ユーザー: 文書検索・閲覧のみ
   - 管理者: 文書のアップロード・削除・管理機能へのアクセス

3. **セキュリティの向上**
   - アクセスログの記録
   - 不正アクセスの検知
   - データ保護の強化

### 背景

- 立教英国学院の内部文書を扱うシステムのため、セキュリティが最優先
- 教育機関として、個人情報保護法（GDPR等）への準拠が必要
- 文書の機密性を保つため、適切なアクセス制御が必須

---

## 📝 機能要件

### FR-1: ユーザー認証

#### FR-1.1: ログイン機能

- **説明**: ユーザーがメールアドレスとパスワードでログインできる
- **優先度**: 高
- **詳細**:
  - メールアドレスとパスワードによる認証
  - セッション管理（JWTトークン）
  - ログイン状態の保持（リフレッシュトークン）
  - ログアウト機能

#### FR-1.2: パスワードリセット機能

- **説明**: パスワードを忘れた場合にリセットできる
- **優先度**: 中
- **詳細**:
  - メールアドレスを入力してリセットリンクを送信
  - リセットリンクから新しいパスワードを設定

#### FR-1.3: メール認証

- **説明**: 新規登録時にメール認証を行う
- **優先度**: 中
- **詳細**:
  - 新規登録時に確認メールを送信
  - メール内のリンクをクリックしてアカウントを有効化

### FR-2: ユーザー管理

#### FR-2.1: ユーザー登録

- **説明**: 管理者が新規ユーザーを登録できる
- **優先度**: 高
- **詳細**:
  - 管理者のみがユーザー登録可能
  - メールアドレス、名前、ロールを設定
  - 初期パスワードを設定（初回ログイン時に変更を促す）

#### FR-2.2: ユーザー一覧表示

- **説明**: 管理者が登録済みユーザー一覧を確認できる
- **優先度**: 中
- **詳細**:
  - ユーザー名、メールアドレス、ロール、最終ログイン日時を表示
  - ページネーション対応

#### FR-2.3: ユーザー編集・削除

- **説明**: 管理者がユーザー情報を編集・削除できる
- **優先度**: 中
- **詳細**:
  - ユーザー情報の編集（名前、ロール、有効/無効）
  - ユーザーの削除（論理削除）

### FR-3: ロールベースアクセス制御（RBAC）

#### FR-3.1: ロール定義

- **説明**: 以下のロールを定義する
- **優先度**: 高
- **詳細**:
  - **一般ユーザー（User）**:
    - 文書検索・閲覧
    - 自分の検索履歴の閲覧
  - **管理者（Admin）**:
    - 一般ユーザーの全機能
    - 文書のアップロード・削除
    - 文書一覧の閲覧・管理
    - ユーザー管理
    - Embedding再生成
  - **スーパー管理者（Super Admin）**:
    - 管理者の全機能
    - システム設定の変更
    - 全ユーザーの管理

#### FR-3.2: 権限チェック

- **説明**: 各機能でロールに基づいた権限チェックを行う
- **優先度**: 高
- **詳細**:
  - APIエンドポイントで権限チェック
  - UIで権限に応じた表示制御

### FR-4: 文書アクセス制御

#### FR-4.1: 文書の閲覧権限

- **説明**: 文書ごとに閲覧可能なユーザーを設定できる
- **優先度**: 中
- **詳細**:
  - デフォルト: 全ユーザーが閲覧可能
  - 特定ユーザーのみ閲覧可能に設定可能
  - 特定ロールのみ閲覧可能に設定可能

#### FR-4.2: 文書のダウンロード権限

- **説明**: 文書のダウンロードを権限のあるユーザーのみに制限
- **優先度**: 高
- **詳細**:
  - 管理者のみダウンロード可能（初期実装）
  - 将来的に文書ごとの設定に対応

### FR-5: アクセスログ

#### FR-5.1: ログイン履歴

- **説明**: ユーザーのログイン履歴を記録
- **優先度**: 中
- **詳細**:
  - ログイン日時、IPアドレス、デバイス情報を記録
  - 管理者が閲覧可能

#### FR-5.2: 操作履歴

- **説明**: 重要な操作（文書アップロード・削除等）の履歴を記録
- **優先度**: 中
- **詳細**:
  - 操作日時、ユーザー、操作内容を記録
  - 管理者が閲覧可能

---

## 🔒 非機能要件

### NFR-1: セキュリティ

- **パスワード要件**:
  - 最小8文字
  - 大文字・小文字・数字を含む
  - 特殊文字を含む（推奨）
- **セッション管理**:
  - JWTトークンの有効期限: 24時間
  - リフレッシュトークンの有効期限: 7日
  - セッションタイムアウト: 30分間の非アクティブ
- **パスワード暗号化**:
  - bcryptを使用（コストファクター: 10）
- **HTTPS必須**:
  - すべての通信をHTTPSで暗号化

### NFR-2: パフォーマンス

- **認証処理の応答時間**: 1秒以内
- **セッション検証の応答時間**: 100ms以内
- **同時ログイン数**: 100ユーザー以上に対応

### NFR-3: 可用性

- **認証サービスの可用性**: 99.9%以上
- **障害時のフォールバック**: 認証エラー時の適切なエラーメッセージ表示

### NFR-4: ユーザビリティ

- **ログイン画面**: シンプルで分かりやすいUI
- **エラーメッセージ**: ユーザーに分かりやすい日本語メッセージ
- **パスワードリセット**: 3ステップ以内で完了

---

## 🔐 認証方式の選択

### 選択肢の比較

| 方式 | メリット | デメリット | 推奨度 |
|------|---------|-----------|--------|
| **Supabase Auth** | ・既存のSupabaseを使用<br>・実装が簡単<br>・メール認証・パスワードリセットが標準装備<br>・JWTトークン管理が自動 | ・Supabaseへの依存が増える | ⭐⭐⭐⭐⭐ |
| **NextAuth.js** | ・Next.jsとの統合が良い<br>・複数の認証プロバイダーに対応<br>・カスタマイズ性が高い | ・実装が複雑<br>・セッション管理を自前で実装 | ⭐⭐⭐ |
| **Google OAuth** | ・Google Workspaceと統合可能<br>・パスワード管理が不要 | ・Googleアカウント必須<br>・組織外のGoogleアカウントもアクセス可能になる可能性 | ⭐⭐⭐ |
| **自前実装** | ・完全なカスタマイズが可能 | ・実装コストが高い<br>・セキュリティリスクが高い | ⭐ |

### 推奨: Supabase Auth

**理由**:
1. 既にSupabaseを使用しているため、追加のインフラが不要
2. 認証機能が標準装備されており、実装が簡単
3. メール認証・パスワードリセットが自動で利用可能
4. JWTトークン管理が自動化されている
5. Row Level Security (RLS) と組み合わせてデータベースレベルでのアクセス制御が可能

---

## 🛡️ 認可の仕組み

### 1. ロールベースアクセス制御（RBAC）

```
┌─────────────────┐
│  Super Admin    │ ← 全権限
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Admin       │ ← 管理権限
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      User       │ ← 閲覧権限のみ
└─────────────────┘
```

### 2. 機能別権限マトリックス

| 機能 | User | Admin | Super Admin |
|------|------|-------|-------------|
| 文書検索 | ✅ | ✅ | ✅ |
| 文書閲覧 | ✅ | ✅ | ✅ |
| 文書ダウンロード | ❌ | ✅ | ✅ |
| 文書アップロード | ❌ | ✅ | ✅ |
| 文書削除 | ❌ | ✅ | ✅ |
| 文書一覧表示 | ❌ | ✅ | ✅ |
| Embedding再生成 | ❌ | ✅ | ✅ |
| ユーザー管理 | ❌ | ❌ | ✅ |
| システム設定 | ❌ | ❌ | ✅ |

### 3. APIエンドポイント別権限

| エンドポイント | User | Admin | Super Admin |
|--------------|------|-------|-------------|
| `GET /api/ask` | ✅ | ✅ | ✅ |
| `GET /api/search-history` | ✅ | ✅ | ✅ |
| `POST /api/admin/ingest` | ❌ | ✅ | ✅ |
| `GET /api/admin/documents` | ❌ | ✅ | ✅ |
| `DELETE /api/admin/documents/[id]` | ❌ | ✅ | ✅ |
| `POST /api/admin/documents/[id]/regenerate` | ❌ | ✅ | ✅ |
| `GET /api/admin/users` | ❌ | ❌ | ✅ |
| `POST /api/admin/users` | ❌ | ❌ | ✅ |

---

## 🗄️ データベース設計

### 1. 新規テーブル

#### `users` テーブル（Supabase Authの拡張）

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_is_active ON public.user_profiles(is_active);
```

#### `access_logs` テーブル

```sql
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'document_upload', 'document_delete', etc.
  resource_type TEXT, -- 'document', 'user', etc.
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX idx_access_logs_action ON public.access_logs(action);
CREATE INDEX idx_access_logs_created_at ON public.access_logs(created_at);
```

#### `document_permissions` テーブル

```sql
CREATE TABLE public.document_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'download', 'edit', 'delete')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id, permission_type)
);

CREATE INDEX idx_document_permissions_document_id ON public.document_permissions(document_id);
CREATE INDEX idx_document_permissions_user_id ON public.document_permissions(user_id);
```

### 2. 既存テーブルの拡張

#### `documents` テーブル

```sql
ALTER TABLE public.documents
  ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_public BOOLEAN DEFAULT true,
  ADD COLUMN access_level TEXT DEFAULT 'all' CHECK (access_level IN ('all', 'role_based', 'user_based'));

CREATE INDEX idx_documents_created_by ON public.documents(created_by);
CREATE INDEX idx_documents_is_public ON public.documents(is_public);
```

### 3. Row Level Security (RLS) ポリシー

```sql
-- user_profilesテーブルのRLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみ閲覧可能
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- 管理者は全ユーザーのプロフィールを閲覧可能
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- documentsテーブルのRLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 公開文書は全ユーザーが閲覧可能
CREATE POLICY "Public documents are viewable by all authenticated users"
  ON public.documents FOR SELECT
  USING (
    is_public = true AND
    auth.role() = 'authenticated'
  );

-- 管理者は全文書を閲覧可能
CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ユーザーは自分が作成した文書を閲覧可能
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (created_by = auth.uid());
```

---

## 🔌 API設計

### 1. 認証API

#### `POST /api/auth/login`

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": "2024-11-29T12:00:00Z"
  }
}
```

#### `POST /api/auth/logout`

**リクエスト**: なし（認証トークンから自動取得）

**レスポンス**:
```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

#### `POST /api/auth/refresh`

**リクエスト**:
```json
{
  "refresh_token": "refresh_token"
}
```

**レスポンス**:
```json
{
  "success": true,
  "access_token": "new_jwt_token",
  "expires_at": "2024-11-29T12:00:00Z"
}
```

### 2. ユーザー管理API（管理者のみ）

#### `GET /api/admin/users`

**認証**: 必須（Admin以上）

**レスポンス**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "is_active": true,
      "last_login_at": "2024-11-28T10:00:00Z",
      "created_at": "2024-11-01T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "per_page": 20
}
```

#### `POST /api/admin/users`

**認証**: 必須（Super Adminのみ）

**リクエスト**:
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "user",
  "password": "temporary_password"
}
```

#### `PUT /api/admin/users/[id]`

**認証**: 必須（Super Adminのみ）

**リクエスト**:
```json
{
  "name": "Updated Name",
  "role": "admin",
  "is_active": true
}
```

### 3. 既存APIの拡張

#### `POST /api/admin/ingest`

**変更点**:
- 認証必須（Admin以上）
- `created_by`フィールドを自動設定

#### `GET /api/admin/documents`

**変更点**:
- 認証必須（Admin以上）
- RLSポリシーにより、権限のある文書のみ返却

#### `DELETE /api/admin/documents/[id]`

**変更点**:
- 認証必須（Admin以上）
- 作成者のみ削除可能（またはSuper Admin）

---

## 🎨 UI設計

### 1. ログイン画面

**パス**: `/login`

**要素**:
- メールアドレス入力フィールド
- パスワード入力フィールド
- 「ログイン」ボタン
- 「パスワードを忘れた場合」リンク
- エラーメッセージ表示エリア

**デザイン**:
- 既存の木目調デザインと統一
- シンプルで分かりやすいレイアウト

### 2. 認証ミドルウェア

**実装**:
- Next.js Middlewareを使用して、認証が必要なページを保護
- 未認証ユーザーは自動的に`/login`にリダイレクト

### 3. ナビゲーションバーの変更

**変更点**:
- ログイン状態に応じて表示を変更
- ログイン済み: ユーザー名、ロール、ログアウトボタン
- 未ログイン: ログインボタン

### 4. 権限に応じたUI制御

**実装**:
- 管理者のみ表示されるボタン・リンク
- 権限のない機能へのアクセス時のエラーメッセージ

---

## 🔒 セキュリティ考慮事項

### 1. パスワードセキュリティ

- **ハッシュ化**: bcryptを使用（コストファクター: 10）
- **パスワード要件**: 最小8文字、大文字・小文字・数字を含む
- **パスワード履歴**: 過去5回のパスワードは再利用不可
- **アカウントロック**: 5回連続ログイン失敗で30分間ロック

### 2. トークンセキュリティ

- **JWT署名**: 強力なシークレットキーを使用
- **トークン有効期限**: アクセストークン24時間、リフレッシュトークン7日
- **トークンリフレッシュ**: リフレッシュトークンは1回のみ使用可能
- **HTTPS必須**: すべての通信をHTTPSで暗号化

### 3. セッション管理

- **セッションタイムアウト**: 30分間の非アクティブで自動ログアウト
- **同時ログイン**: 同一アカウントの同時ログインを許可（必要に応じて制限可能）
- **セッション固定攻撃対策**: ログイン時にセッションIDを再生成

### 4. アクセス制御

- **Row Level Security (RLS)**: SupabaseのRLSを使用してデータベースレベルでアクセス制御
- **API認証**: すべてのAPIエンドポイントで認証チェック
- **CSRF対策**: SameSite Cookie属性を使用

### 5. 監査ログ

- **ログイン履歴**: すべてのログイン試行を記録
- **操作履歴**: 重要な操作（文書アップロード・削除等）を記録
- **ログ保持期間**: 1年間（必要に応じて延長可能）

---

## 📊 実装の優先順位

### Phase 1: 基本認証機能（高優先度）

1. ✅ Supabase Authのセットアップ
2. ✅ ログイン・ログアウト機能
3. ✅ 認証ミドルウェアの実装
4. ✅ ログイン画面の作成
5. ✅ ナビゲーションバーの認証対応

**期間**: 1-2週間

### Phase 2: ロールベースアクセス制御（高優先度）

1. ✅ ユーザープロフィールテーブルの作成
2. ✅ ロール定義（User, Admin, Super Admin）
3. ✅ APIエンドポイントの権限チェック
4. ✅ UIの権限に応じた表示制御

**期間**: 1週間

### Phase 3: 文書アクセス制御（中優先度）

1. ✅ 文書のダウンロード権限チェック
2. ✅ 文書のアップロード権限チェック
3. ✅ RLSポリシーの実装
4. ✅ 文書ごとの権限設定（将来対応）

**期間**: 1週間

### Phase 4: ユーザー管理機能（中優先度）

1. ✅ ユーザー一覧表示
2. ✅ ユーザー登録機能（管理者のみ）
3. ✅ ユーザー編集・削除機能
4. ✅ パスワードリセット機能

**期間**: 1週間

### Phase 5: 監査ログ（低優先度）

1. ✅ アクセスログテーブルの作成
2. ✅ ログイン履歴の記録
3. ✅ 操作履歴の記録
4. ✅ ログ閲覧画面（管理者のみ）

**期間**: 1週間

---

## 🛠️ 実装方針

### 1. 技術スタック

- **認証**: Supabase Auth
- **セッション管理**: Supabase Session（JWT）
- **認証ミドルウェア**: Next.js Middleware
- **UI**: 既存のReactコンポーネントを拡張

### 2. 実装の流れ

1. **Supabase Authのセットアップ**
   - Supabase Dashboardで認証を有効化
   - メール認証の設定
   - パスワード要件の設定

2. **データベースの拡張**
   - `user_profiles`テーブルの作成
   - `access_logs`テーブルの作成
   - `documents`テーブルの拡張
   - RLSポリシーの実装

3. **認証機能の実装**
   - ログイン・ログアウトAPI
   - 認証ミドルウェア
   - ログイン画面

4. **認可機能の実装**
   - ロール定義
   - APIエンドポイントの権限チェック
   - UIの権限に応じた表示制御

5. **既存機能の統合**
   - 既存のAPIエンドポイントに認証チェックを追加
   - 既存のUIに認証状態を反映

### 3. テスト方針

- **単体テスト**: 認証・認可ロジックのテスト
- **統合テスト**: APIエンドポイントの認証チェックテスト
- **E2Eテスト**: ログインから機能利用までのフローテスト

### 4. 移行計画

1. **既存データの移行**
   - 既存の文書データに`created_by`を設定（必要に応じて）
   - 既存のユーザーを`user_profiles`テーブルに移行

2. **段階的なロールアウト**
   - Phase 1を実装してテスト
   - 問題がなければPhase 2以降を順次実装

3. **ユーザーへの通知**
   - 認証機能の追加をユーザーに通知
   - 初期パスワードの設定方法を案内

---

## 📚 参考資料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## ✅ 承認

- **作成者**: AI Assistant
- **レビュー**: 未実施
- **承認**: 未承認

---

**更新履歴**:
- 2024-11-28: 初版作成

