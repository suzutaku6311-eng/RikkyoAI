# Google Spreadsheet リアルタイム連携設計書

## 📋 概要

Google Spreadsheetの議事録データを定期的に自動取得し、RAG検索可能な形式に変換するシステムの設計書です。

## 🎯 目的

- 毎日更新される議事録データを手動アップロードすることなく、自動的にRAG検索可能にする
- リアルタイムに近い形で最新の議事録情報を検索できるようにする
- 差分更新により、効率的にデータを同期する

## 🏗️ アーキテクチャ設計

### 1. システム構成

```
Google Spreadsheet
    ↓ (Google Sheets API)
Vercel Cron Job / Supabase Cron
    ↓ (定期実行: 15分〜1時間ごと)
API Route (/api/admin/sync-sheets)
    ↓
データ取得・差分検知
    ↓
テキスト抽出・チャンク分割
    ↓
Embedding生成
    ↓
Supabase (documents, chunks テーブル)
    ↓
RAG検索システム
```

### 2. データフロー

```
1. スプレッドシート登録
   - 管理者がスプレッドシートURLとシート名を登録
   - Supabaseの `google_sheets_sources` テーブルに保存

2. 定期同期（Cron Job）
   - Vercel Cron Jobs または Supabase pg_cron で定期実行
   - 登録済みのスプレッドシートを順次処理

3. 変更検知
   - 最終同期時刻と現在のスプレッドシートの更新時刻を比較
   - 変更がある場合のみ処理を実行

4. データ取得
   - Google Sheets API v4 でデータを取得
   - 行ごとにテキストを結合（日付、議題、内容など）

5. チャンク処理
   - 既存のチャンクと比較して差分を検出
   - 変更・追加分のみEmbedding生成

6. データ保存
   - Supabaseの documents と chunks テーブルに保存
   - メタデータ（スプレッドシートURL、シート名、最終同期時刻）を記録
```

## 📊 データベース設計

### 新規テーブル: `google_sheets_sources`

```sql
CREATE TABLE google_sheets_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spreadsheet_id TEXT NOT NULL, -- Google Spreadsheet ID
  spreadsheet_url TEXT NOT NULL, -- スプレッドシートのURL
  sheet_name TEXT NOT NULL, -- シート名（例: "議事録"）
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE, -- 関連するdocumentレコード
  last_synced_at TIMESTAMPTZ, -- 最終同期時刻
  last_sheet_modified_at TIMESTAMPTZ, -- スプレッドシートの最終更新時刻
  sync_enabled BOOLEAN DEFAULT true, -- 同期を有効にするか
  sync_interval_minutes INTEGER DEFAULT 60, -- 同期間隔（分）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_google_sheets_sources_sync_enabled 
  ON google_sheets_sources(sync_enabled) 
  WHERE sync_enabled = true;
```

### `documents` テーブルの拡張

```sql
ALTER TABLE documents 
  ADD COLUMN source_type TEXT DEFAULT 'upload'; -- 'upload' | 'google_sheets'
  ADD COLUMN google_sheet_source_id UUID REFERENCES google_sheets_sources(id);
```

## 🔧 技術スタック

### 1. Google Sheets API

**必要なパッケージ:**
- `googleapis` (Node.js用のGoogle APIクライアント)
- または `@google-cloud/sheets` (より軽量な選択肢)

**認証方法:**
- **サービスアカウント**（推奨）
  - JSONキーファイルを使用
  - スプレッドシートを共有設定でサービスアカウントのメールアドレスに共有
  - 環境変数に認証情報を保存

- **OAuth 2.0**（ユーザー認証が必要な場合）
  - より複雑だが、ユーザー固有のスプレッドシートにアクセス可能

### 2. 定期実行の実装方法

#### 方法A: Vercel Cron Jobs（推奨）

`vercel.json` に設定:

```json
{
  "crons": [
    {
      "path": "/api/admin/sync-sheets",
      "schedule": "*/60 * * * *"
    }
  ]
}
```

- 60分ごとに実行
- Vercelの無料プランでも利用可能
- 設定が簡単

#### 方法B: Supabase pg_cron

```sql
SELECT cron.schedule(
  'sync-google-sheets',
  '*/60 * * * *', -- 60分ごと
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/admin/sync-sheets',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SECRET_TOKEN"}'::jsonb
  );
  $$
);
```

- SupabaseのPostgreSQL拡張機能を使用
- より柔軟なスケジューリングが可能

#### 方法C: 外部Cronサービス

- GitHub Actions（無料）
- EasyCron（有料）
- cron-job.org（無料）

## 📝 API設計

### 1. スプレッドシート登録API

**エンドポイント:** `POST /api/admin/google-sheets/register`

**リクエスト:**
```json
{
  "spreadsheet_url": "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit",
  "sheet_name": "議事録",
  "title": "2024年度 議事録",
  "sync_interval_minutes": 60
}
```

**処理:**
1. URLからSpreadsheet IDを抽出
2. Google Sheets APIでアクセス確認
3. `google_sheets_sources` テーブルに登録
4. 初回同期を実行

### 2. 同期実行API

**エンドポイント:** `POST /api/admin/sync-sheets`

**処理:**
1. `sync_enabled = true` のスプレッドシートを取得
2. 各スプレッドシートについて:
   - 最終同期時刻を確認
   - Google Sheets APIで最新の更新時刻を取得
   - 変更がある場合のみ処理
   - データ取得 → チャンク分割 → Embedding生成 → 保存
   - `last_synced_at` を更新

### 3. スプレッドシート一覧API

**エンドポイント:** `GET /api/admin/google-sheets`

**レスポンス:**
```json
{
  "sources": [
    {
      "id": "uuid",
      "spreadsheet_url": "https://...",
      "sheet_name": "議事録",
      "title": "2024年度 議事録",
      "last_synced_at": "2024-01-15T10:30:00Z",
      "last_sheet_modified_at": "2024-01-15T10:25:00Z",
      "sync_enabled": true,
      "sync_interval_minutes": 60
    }
  ]
}
```

### 4. 手動同期API

**エンドポイント:** `POST /api/admin/google-sheets/[id]/sync`

特定のスプレッドシートを手動で同期

## 🔐 認証設定

### Google Cloud Platform での設定

1. **プロジェクト作成**
   - Google Cloud Consoleでプロジェクトを作成

2. **Google Sheets API有効化**
   - APIライブラリから「Google Sheets API」を有効化

3. **サービスアカウント作成**
   - IAM & Admin > Service Accounts
   - サービスアカウントを作成
   - JSONキーをダウンロード

4. **スプレッドシートの共有設定**
   - 対象のスプレッドシートを開く
   - 「共有」ボタンからサービスアカウントのメールアドレスを追加
   - 「閲覧者」権限を付与

### 環境変数

```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_PROJECT_ID=your-project-id
```

または、JSONキーファイル全体をBase64エンコード:

```env
GOOGLE_SHEETS_CREDENTIALS_JSON_BASE64=base64_encoded_json_string
```

## 📐 実装の詳細設計

### 1. Google Sheets API クライアント

```typescript
// lib/google-sheets.ts

import { google } from 'googleapis';

export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export async function getSheetData(
  spreadsheetId: string,
  sheetName: string,
  range?: string
) {
  const sheets = await getGoogleSheetsClient();
  const rangeString = range || `${sheetName}!A:Z`;
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: rangeString,
  });

  return response.data.values || [];
}

export async function getSpreadsheetMetadata(spreadsheetId: string) {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return {
    title: response.data.properties?.title,
    modifiedTime: response.data.properties?.modifiedTime,
    sheets: response.data.sheets?.map(sheet => ({
      title: sheet.properties?.title,
      sheetId: sheet.properties?.sheetId,
    })),
  };
}
```

### 2. 差分検知ロジック

```typescript
// lib/sheet-sync.ts

interface SheetRow {
  date: string;
  topic: string;
  content: string;
  // ... その他の列
}

export function detectChanges(
  existingRows: SheetRow[],
  newRows: SheetRow[]
): {
  added: SheetRow[];
  modified: SheetRow[];
  deleted: SheetRow[];
} {
  // 日付と議題をキーとして比較
  const existingMap = new Map(
    existingRows.map(row => [`${row.date}_${row.topic}`, row])
  );
  const newMap = new Map(
    newRows.map(row => [`${row.date}_${row.topic}`, row])
  );

  const added: SheetRow[] = [];
  const modified: SheetRow[] = [];
  const deleted: SheetRow[] = [];

  // 追加・変更を検出
  for (const [key, newRow] of newMap) {
    const existingRow = existingMap.get(key);
    if (!existingRow) {
      added.push(newRow);
    } else if (JSON.stringify(existingRow) !== JSON.stringify(newRow)) {
      modified.push(newRow);
    }
  }

  // 削除を検出
  for (const [key, existingRow] of existingMap) {
    if (!newMap.has(key)) {
      deleted.push(existingRow);
    }
  }

  return { added, modified, deleted };
}
```

### 3. スプレッドシートデータのテキスト変換

```typescript
// lib/sheet-to-text.ts

export function convertSheetRowsToText(rows: any[][]): string {
  // ヘッダー行を取得
  const headers = rows[0] || [];
  
  // データ行をテキストに変換
  const textRows = rows.slice(1).map((row, index) => {
    const rowData = headers.map((header, colIndex) => {
      return `${header}: ${row[colIndex] || ''}`;
    }).join('\n');
    
    return `--- 議事録 ${index + 1} ---\n${rowData}\n`;
  });

  return textRows.join('\n');
}
```

## 🎨 UI設計

### 1. スプレッドシート登録ページ

**パス:** `/admin/google-sheets/register`

**機能:**
- スプレッドシートURL入力
- シート名選択（ドロップダウン）
- タイトル入力
- 同期間隔設定
- 登録ボタン

### 2. スプレッドシート管理ページ

**パス:** `/admin/google-sheets`

**機能:**
- 登録済みスプレッドシート一覧
- 最終同期時刻表示
- 手動同期ボタン
- 同期の有効/無効切り替え
- 削除ボタン

## ⚠️ 注意事項と制約

### 1. Google Sheets API の制限

- **リクエスト制限:**
  - 1分あたり100リクエスト（デフォルト）
  - 1日あたり100万リクエスト（デフォルト）
  - クォータ増加は要申請

- **推奨事項:**
  - 同期間隔を60分以上に設定
  - バッチ処理で複数スプレッドシートを順次処理
  - エラーハンドリングとリトライ機構を実装

### 2. コスト

- **Vercel Cron Jobs:** 無料プランでも利用可能
- **Google Sheets API:** 無料（制限内）
- **OpenAI Embedding API:** 使用量に応じた課金
- **Supabase:** 無料プランでも利用可能

### 3. セキュリティ

- サービスアカウントの認証情報は環境変数で管理
- スプレッドシートへのアクセス権限を最小限に
- APIエンドポイントに認証トークンを設定（Cron実行時）

### 4. エラーハンドリング

- Google Sheets APIのエラー（権限不足、スプレッドシート削除など）
- ネットワークエラー
- Embedding生成の失敗
- リトライ機構の実装

## 📈 拡張可能性

### 1. 複数シート対応

- 1つのスプレッドシート内の複数シートを個別に登録可能

### 2. カスタム列マッピング

- スプレッドシートの列をカスタムマッピング
- 特定の列のみを検索対象に

### 3. 通知機能

- 同期エラー時の通知
- 新しい議事録追加時の通知

### 4. 履歴管理

- 過去の議事録のバージョン管理
- 変更履歴の追跡

## 🚀 実装の優先順位

### Phase 1: 基本機能
1. Google Sheets API認証設定
2. スプレッドシート登録機能
3. 手動同期機能
4. データ取得とチャンク分割

### Phase 2: 自動化
1. Cron Job設定
2. 差分検知機能
3. 自動同期機能

### Phase 3: UI改善
1. 管理画面の実装
2. 同期状態の可視化
3. エラー表示と通知

### Phase 4: 最適化
1. バッチ処理の最適化
2. キャッシュ機能
3. パフォーマンス改善

## 📚 参考資料

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)

## ✅ 実装前の確認事項

- [ ] Google Cloud Platformプロジェクトの作成
- [ ] Google Sheets APIの有効化
- [ ] サービスアカウントの作成と認証情報の取得
- [ ] 対象スプレッドシートの共有設定
- [ ] 環境変数の設定
- [ ] データベースマイグレーションの準備
- [ ] テスト用スプレッドシートの準備

