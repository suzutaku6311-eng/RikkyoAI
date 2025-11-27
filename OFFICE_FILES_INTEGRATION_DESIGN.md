# Excel/Word ファイル自動同期機能 設計書

## 📋 概要

Excel（.xlsx, .xls）やWord（.docx）ファイルをクラウドストレージから自動的に取得し、RAG検索可能にする機能の設計書です。

## 🎯 目的

- Google Sheetsと同様に、Excel/Wordファイルも自動同期できるようにする
- クラウドストレージ（OneDrive、Google Drive、Dropbox等）からファイルを自動取得
- ファイル変更を検知して自動的にRAG検索可能な形式に変換

## 🏗️ アーキテクチャ設計

### 1. システム構成

```
クラウドストレージ（OneDrive/Google Drive/Dropbox）
    ↓ (各ストレージAPI)
Vercel Cron Job / Supabase Cron
    ↓ (定期実行: 15分〜1時間ごと)
API Route (/api/admin/sync-office-files)
    ↓
ファイル変更検知
    ↓
ファイルダウンロード
    ↓
テキスト抽出（既存のingest処理を再利用）
    ↓
チャンク分割・Embedding生成
    ↓
Supabase (documents, chunks テーブル)
    ↓
RAG検索システム
```

### 2. 対応可能なストレージサービス

#### A. Microsoft OneDrive / SharePoint（推奨）

**メリット:**
- Excel/Wordファイルのネイティブサポート
- Microsoft Graph APIが充実
- 企業環境でよく使用される

**必要なAPI:**
- Microsoft Graph API
- 認証: Azure AD App Registration

**実装の流れ:**
1. Azure ADでアプリ登録
2. Microsoft Graph APIでファイル一覧取得
3. ファイル変更時刻を比較して差分検知
4. ファイルをダウンロード
5. 既存のingest処理でテキスト抽出・Embedding生成

#### B. Google Drive

**メリット:**
- Google Workspace環境で利用可能
- Google Sheets APIと同様の認証フロー
- 無料プランでも利用可能

**必要なAPI:**
- Google Drive API
- 認証: OAuth 2.0 または サービスアカウント

**実装の流れ:**
1. Google Drive APIでファイル一覧取得
2. ファイル変更時刻を比較
3. ファイルをダウンロード
4. 既存のingest処理でテキスト抽出・Embedding生成

#### C. Dropbox

**メリット:**
- シンプルなAPI
- 個人利用でも広く使われている

**必要なAPI:**
- Dropbox API v2
- 認証: OAuth 2.0 または App Token

#### D. その他のストレージサービス

- Box
- AWS S3
- Azure Blob Storage

## 📊 データベース設計

### 新規テーブル: `cloud_storage_sources`

```sql
CREATE TABLE cloud_storage_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage_type TEXT NOT NULL, -- 'onedrive' | 'google_drive' | 'dropbox' | 'sharepoint'
  file_id TEXT NOT NULL, -- ストレージサービス上のファイルID
  file_name TEXT NOT NULL,
  file_path TEXT, -- ストレージサービス上のパス
  file_url TEXT, -- ファイルのURL（可能な場合）
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  last_synced_at TIMESTAMPTZ,
  last_file_modified_at TIMESTAMPTZ, -- ストレージ上の最終更新時刻
  file_size BIGINT, -- ファイルサイズ（バイト）
  sync_enabled BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 60,
  storage_account_email TEXT, -- ストレージアカウントのメールアドレス（識別用）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(storage_type, file_id) -- 同じファイルの重複登録を防ぐ
);

CREATE INDEX idx_cloud_storage_sources_sync_enabled 
  ON cloud_storage_sources(sync_enabled) 
  WHERE sync_enabled = true;

CREATE INDEX idx_cloud_storage_sources_storage_type 
  ON cloud_storage_sources(storage_type);
```

### `documents` テーブルの拡張

```sql
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS cloud_storage_source_id UUID REFERENCES cloud_storage_sources(id);
```

## 🔧 技術スタック

### 1. Microsoft OneDrive / SharePoint

**必要なパッケージ:**
- `@microsoft/microsoft-graph-client` - Microsoft Graph APIクライアント
- `@azure/msal-node` - Azure AD認証

**認証方法:**
- Azure AD App Registration
- Client Credentials Flow（アプリケーション認証）
- または、Delegated Permissions（ユーザー認証）

**環境変数:**
```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
```

### 2. Google Drive

**必要なパッケージ:**
- `googleapis`（既にインストール済み）

**認証方法:**
- サービスアカウント（Google Sheetsと同じ）
- OAuth 2.0（ユーザー固有のファイルにアクセスする場合）

**環境変数:**
```env
# Google Sheetsと同じ認証情報を使用可能
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY=...
GOOGLE_SHEETS_PROJECT_ID=...
```

### 3. Dropbox

**必要なパッケージ:**
- `dropbox` - Dropbox API SDK

**認証方法:**
- OAuth 2.0
- App Token（個人用）

**環境変数:**
```env
DROPBOX_ACCESS_TOKEN=your-access-token
```

## 📝 API設計

### 1. ファイル登録API

**エンドポイント:** `POST /api/admin/cloud-storage/register`

**リクエスト:**
```json
{
  "storage_type": "onedrive",
  "file_id": "file-id-from-storage",
  "file_path": "/Documents/議事録.xlsx",
  "title": "2024年度 議事録",
  "sync_interval_minutes": 60
}
```

**処理:**
1. ストレージAPIでファイル情報を取得
2. ファイル変更時刻を確認
3. ファイルをダウンロード
4. 既存のingest処理でテキスト抽出・Embedding生成
5. `cloud_storage_sources`テーブルに登録

### 2. 同期実行API

**エンドポイント:** `POST /api/admin/sync-cloud-storage`

**処理:**
1. `sync_enabled = true`のファイルを取得
2. 各ファイルについて:
   - ストレージAPIで最新の更新時刻を取得
   - 変更がある場合のみ処理
   - ファイルダウンロード → ingest処理 → 保存
   - `last_synced_at`を更新

### 3. ファイル一覧API

**エンドポイント:** `GET /api/admin/cloud-storage`

**レスポンス:**
```json
{
  "sources": [
    {
      "id": "uuid",
      "storage_type": "onedrive",
      "file_name": "議事録.xlsx",
      "file_path": "/Documents/議事録.xlsx",
      "last_synced_at": "2024-01-15T10:30:00Z",
      "last_file_modified_at": "2024-01-15T10:25:00Z",
      "sync_enabled": true,
      "sync_interval_minutes": 60
    }
  ]
}
```

## 🔐 認証設定

### Microsoft OneDrive / SharePoint

#### ステップ1: Azure AD App Registration

1. [Azure Portal](https://portal.azure.com/)にアクセス
2. 「Azure Active Directory」>「アプリの登録」>「新規登録」
3. アプリ名を入力（例: `Rikkyo AI Office Files Sync`）
4. 「登録」をクリック
5. 「証明書とシークレット」>「新しいクライアントシークレット」
6. シークレットを生成して保存

#### ステップ2: API権限の設定

1. 「APIのアクセス許可」に移動
2. 「Microsoft Graph」>「アプリケーションのアクセス許可」を追加:
   - `Files.Read.All` - ファイル読み取り
   - `Sites.Read.All` - SharePointサイト読み取り（SharePoint使用時）

#### ステップ3: 管理者の同意

1. 「管理者の同意を与える」をクリック

#### ステップ4: 環境変数設定

```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
```

### Google Drive

Google Sheetsと同じ認証情報を使用可能です。

### Dropbox

#### ステップ1: Dropbox App作成

1. [Dropbox App Console](https://www.dropbox.com/developers/apps)にアクセス
2. 「Create app」をクリック
3. 「Scoped access」を選択
4. 「Full Dropbox」を選択
5. アプリ名を入力
6. 「Create app」をクリック

#### ステップ2: Access Token生成

1. 「Permissions」タブで必要な権限を設定:
   - `files.content.read` - ファイル読み取り
2. 「Generate access token」をクリック
3. トークンを保存

#### ステップ3: 環境変数設定

```env
DROPBOX_ACCESS_TOKEN=your-access-token
```

## 📐 実装の詳細設計

### 1. Microsoft Graph API クライアント

```typescript
// lib/microsoft-graph.ts

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

export async function getMicrosoftGraphClient() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error('Microsoft認証情報が設定されていません');
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new ClientCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  const client = Client.initWithMiddleware({ authProvider });
  return client;
}

export async function getFileMetadata(fileId: string) {
  const client = await getMicrosoftGraphClient();
  const file = await client.api(`/me/drive/items/${fileId}`).get();
  
  return {
    id: file.id,
    name: file.name,
    lastModifiedDateTime: file.lastModifiedDateTime,
    size: file.size,
    webUrl: file.webUrl,
  };
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  const client = await getMicrosoftGraphClient();
  const fileContent = await client.api(`/me/drive/items/${fileId}/content`).get();
  return Buffer.from(fileContent);
}
```

### 2. Google Drive API クライアント

```typescript
// lib/google-drive.ts

import { google } from 'googleapis';

export async function getGoogleDriveClient() {
  // Google Sheetsと同じ認証を使用
  const serviceAccountEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Google認証情報が設定されていません');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

export async function getFileMetadata(fileId: string) {
  const drive = await getGoogleDriveClient();
  const response = await drive.files.get({
    fileId,
    fields: 'id,name,modifiedTime,size,webViewLink',
  });

  return {
    id: response.data.id!,
    name: response.data.name!,
    modifiedTime: response.data.modifiedTime,
    size: response.data.size,
    webUrl: response.data.webViewLink,
  };
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = await getGoogleDriveClient();
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  
  return Buffer.from(response.data as ArrayBuffer);
}
```

### 3. 統合同期処理

```typescript
// lib/cloud-storage-sync.ts

import { getMicrosoftGraphClient } from './microsoft-graph';
import { getGoogleDriveClient } from './google-drive';
// import { getDropboxClient } from './dropbox';

export async function syncCloudStorageFile(source: CloudStorageSource) {
  let fileBuffer: Buffer;
  let metadata: FileMetadata;

  switch (source.storage_type) {
    case 'onedrive':
    case 'sharepoint':
      metadata = await getFileMetadata(source.file_id);
      fileBuffer = await downloadFileFromOneDrive(source.file_id);
      break;
    
    case 'google_drive':
      metadata = await getFileMetadata(source.file_id);
      fileBuffer = await downloadFileFromGoogleDrive(source.file_id);
      break;
    
    // case 'dropbox':
    //   metadata = await getFileMetadataFromDropbox(source.file_id);
    //   fileBuffer = await downloadFileFromDropbox(source.file_id);
    //   break;
    
    default:
      throw new Error(`未対応のストレージタイプ: ${source.storage_type}`);
  }

  // 変更検知
  const lastModified = metadata.lastModifiedDateTime 
    ? new Date(metadata.lastModifiedDateTime) 
    : null;
  const lastSynced = source.last_file_modified_at 
    ? new Date(source.last_file_modified_at) 
    : null;

  if (lastModified && lastSynced && lastModified <= lastSynced) {
    return { skipped: true, reason: 'no_changes' };
  }

  // 既存のingest処理を再利用
  // ingest処理でテキスト抽出・Embedding生成・保存
  await ingestFileBuffer(fileBuffer, metadata.name, source.document_id);

  return { success: true };
}
```

## 🎨 UI設計

### 1. クラウドストレージ登録ページ

**パス:** `/admin/cloud-storage/register`

**機能:**
- ストレージタイプ選択（OneDrive / Google Drive / Dropbox）
- ファイル選択（ファイルピッカーまたはファイルID入力）
- タイトル入力
- 同期間隔設定
- 登録ボタン

### 2. クラウドストレージ管理ページ

**パス:** `/admin/cloud-storage`

**機能:**
- 登録済みファイル一覧
- ストレージタイプ別フィルタ
- 最終同期時刻表示
- 手動同期ボタン
- 同期の有効/無効切り替え
- 削除ボタン

## ⚠️ 注意事項と制約

### 1. API制限

**Microsoft Graph API:**
- 1分あたり10,000リクエスト（デフォルト）
- 1日あたり1,000,000リクエスト（デフォルト）

**Google Drive API:**
- 1分あたり1,000リクエスト（デフォルト）
- 1日あたり1,000,000,000リクエスト（デフォルト）

**推奨事項:**
- 同期間隔を60分以上に設定
- バッチ処理で複数ファイルを順次処理
- エラーハンドリングとリトライ機構を実装

### 2. ファイルサイズ制限

- Vercel無料プラン: 4.5MB
- 大きなファイルは分割処理が必要な場合がある

### 3. 認証の複雑さ

- 各ストレージサービスで認証方法が異なる
- OAuth 2.0の実装が必要な場合がある
- トークンのリフレッシュ処理が必要

### 4. コスト

- **Microsoft Graph API:** 無料（制限内）
- **Google Drive API:** 無料（制限内）
- **Dropbox API:** 無料（制限内）
- **OpenAI Embedding API:** 使用量に応じた課金
- **Vercel Cron Jobs:** 無料プランでも利用可能

## 📈 実装の優先順位

### Phase 1: Microsoft OneDrive / SharePoint（推奨）

1. Azure AD App Registration設定
2. Microsoft Graph APIクライアント実装
3. ファイル登録機能
4. 手動同期機能
5. 自動同期機能（Cron Job）

### Phase 2: Google Drive

1. Google Drive APIクライアント実装（Google Sheets認証を再利用）
2. ファイル登録機能
3. 同期機能

### Phase 3: Dropbox

1. Dropbox APIクライアント実装
2. ファイル登録機能
3. 同期機能

### Phase 4: UI改善

1. 管理画面の実装
2. ファイルピッカーの統合
3. 同期状態の可視化

## 🚀 実装のメリット

### Google Sheets連携との比較

| 機能 | Google Sheets | Excel/Word（クラウドストレージ） |
|------|--------------|--------------------------------|
| リアルタイム性 | 高い（APIで直接取得） | 中（ファイル変更を検知） |
| 実装の複雑さ | 低（シンプルなAPI） | 中（複数のストレージ対応） |
| ファイル形式 | スプレッドシートのみ | Excel、Word、PDF等 |
| 企業環境での利用 | 中 | 高（OneDrive/SharePoint） |
| 認証の複雑さ | 低（サービスアカウント） | 中（OAuth 2.0等） |

### 推奨される実装順序

1. **Microsoft OneDrive / SharePoint** - 企業環境で最も需要が高い
2. **Google Drive** - Google Sheetsと同じ認証を再利用できる
3. **Dropbox** - 個人利用でも広く使われている

## 📚 参考資料

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Google Drive API Documentation](https://developers.google.com/drive)
- [Dropbox API Documentation](https://www.dropbox.com/developers/documentation)
- [既存のingest処理: app/api/admin/ingest/route.ts](../app/api/admin/ingest/route.ts)

## ✅ 実装前の確認事項

### Microsoft OneDrive / SharePoint
- [ ] Azure AD App Registrationの作成
- [ ] API権限の設定と管理者同意
- [ ] 環境変数の設定
- [ ] テスト用ファイルの準備

### Google Drive
- [ ] Google Drive APIの有効化
- [ ] サービスアカウントの設定（Google Sheetsと同じ）
- [ ] テスト用ファイルの準備

### Dropbox
- [ ] Dropbox Appの作成
- [ ] Access Tokenの生成
- [ ] 環境変数の設定
- [ ] テスト用ファイルの準備

