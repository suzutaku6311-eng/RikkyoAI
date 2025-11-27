# Google Sheets連携機能 セットアップガイド

## 📋 概要

Google Spreadsheetの議事録データを自動的にRAG検索可能にする機能のセットアップ手順です。

## 🔧 必要な設定

### 1. Google Cloud Platform での設定

#### ステップ1: プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）

#### ステップ2: Google Sheets API有効化

1. 「APIとサービス」>「ライブラリ」に移動
2. 「Google Sheets API」を検索
3. 「有効にする」をクリック

#### ステップ3: サービスアカウント作成

1. 「IAMと管理」>「サービスアカウント」に移動
2. 「サービスアカウントを作成」をクリック
3. サービスアカウント名を入力（例: `rikkyo-ai-sheets`）
4. 「作成して続行」をクリック
5. ロールは「編集者」または「閲覧者」を選択（読み取り専用の場合は「閲覧者」）
6. 「完了」をクリック

#### ステップ4: JSONキーのダウンロード

1. 作成したサービスアカウントをクリック
2. 「キー」タブに移動
3. 「キーを追加」>「新しいキーを作成」を選択
4. 「JSON」を選択して「作成」
5. JSONファイルがダウンロードされます（**このファイルは安全に保管してください**）

#### ステップ5: スプレッドシートの共有設定

1. 連携したいGoogle Spreadsheetを開く
2. 「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（`your-service-account@project-id.iam.gserviceaccount.com`）を追加
4. 権限は「閲覧者」で十分です
5. 「送信」をクリック

### 2. Vercel環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

```env
# Google Sheets API認証情報
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_PROJECT_ID=your-project-id

# Supabase Service Role Key（既に設定済みの場合は不要）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Job認証（オプション、セキュリティのため推奨）
CRON_SECRET=your-random-secret-string
```

**注意:**
- `GOOGLE_SHEETS_PRIVATE_KEY`は、JSONファイルの`private_key`フィールドの値をそのまま設定します
- 改行文字（`\n`）はそのまま含めてください
- ダブルクォートで囲む必要があります

### 3. Supabaseデータベースマイグレーション

SupabaseダッシュボードのSQL Editorで以下のSQLを実行してください：

```sql
-- migrations/create_google_sheets_sources_table.sql の内容を実行
```

または、`migrations/create_google_sheets_sources_table.sql`ファイルの内容をコピーして実行してください。

## 🚀 使用方法

### 1. スプレッドシートの登録

1. アプリにログイン
2. ナビゲーションバーから「📊 Google Sheets」をクリック
3. 「+ 新規登録」ボタンをクリック
4. スプレッドシートURLを入力
5. シート名を入力（例: "議事録"）
6. タイトルと同期間隔を設定（オプション）
7. 「登録」ボタンをクリック

### 2. 手動同期

1. Google Sheets管理ページで登録済みスプレッドシートを確認
2. 「🔄 同期」ボタンをクリック
3. 同期が完了すると、最新のデータがRAG検索可能になります

### 3. 自動同期

Vercel Cron Jobsが設定されている場合、1時間ごとに自動的に同期が実行されます。

## ⚠️ トラブルシューティング

### エラー: "スプレッドシートへのアクセス権限がありません"

- サービスアカウントのメールアドレスがスプレッドシートに共有されているか確認
- 共有設定で「閲覧者」以上の権限が付与されているか確認

### エラー: "Google Sheets認証情報が設定されていません"

- Vercelの環境変数が正しく設定されているか確認
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`と`GOOGLE_SHEETS_PRIVATE_KEY`が設定されているか確認
- 環境変数の変更後、Vercelの再デプロイが必要な場合があります

### エラー: "シートが見つかりません"

- シート名が正確に入力されているか確認（大文字小文字を区別）
- スプレッドシート内にそのシートが存在するか確認

### 同期が実行されない

- `sync_enabled`が`true`になっているか確認
- 同期間隔が経過しているか確認（最後の同期時刻から指定した間隔以上経過している必要があります）
- Vercel Cron Jobsが正しく設定されているか確認

## 📚 参考資料

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [設計書: GOOGLE_SHEETS_INTEGRATION_DESIGN.md](./GOOGLE_SHEETS_INTEGRATION_DESIGN.md)

