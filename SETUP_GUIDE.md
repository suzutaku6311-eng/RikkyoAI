# Supabase セットアップ完全ガイド

このガイドに従って、Supabaseのセットアップを完了してください。

## 📋 セットアップチェックリスト

- [ ] 手順1: Supabaseプロジェクトを作成
- [ ] 手順2: 接続情報を取得して `.env.local` に設定
- [ ] 手順3: SQL Editorで `supabase-schema.sql` を実行

---

## 手順1: Supabaseプロジェクト作成

### 1.1 Supabaseにアクセス

1. ブラウザで https://supabase.com を開く
2. 「Start your project」または「Sign in」をクリック
3. GitHub、Google、またはメールアドレスでログイン

### 1.2 プロジェクトを作成

1. ダッシュボードで「New project」をクリック
2. 以下の情報を入力：
   - **Name**: `rag-internal-ai`（任意の名前）
   - **Database Password**: 強力なパスワードを設定（忘れないようにメモ！）
   - **Region**: 日本なら `Northeast Asia (Tokyo)` を推奨
3. 「Create new project」をクリック
4. プロジェクトの作成が完了するまで待機（1-2分）

### 1.3 プロジェクトが準備できたら

プロジェクトのダッシュボードが表示されたら、次の手順に進みます。

---

## 手順2: 接続情報の取得と設定

### 2.1 API情報を取得

1. Supabase Dashboard の左サイドバーから「**Settings**」（⚙️アイコン）をクリック
2. 「**API**」をクリック
3. 以下の情報をコピー：
   - **Project URL** → これが `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** キー → これが `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.2 .env.localファイルを作成

プロジェクトルートに `.env.local` ファイルを作成します：

```bash
# プロジェクトルートで実行
cp .env.local.template .env.local
```

### 2.3 環境変数を設定

`.env.local` ファイルを開き、取得した情報を貼り付けます：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...（後で設定可）
```

**重要**: 
- `NEXT_PUBLIC_` プレフィックスは必須です
- 値の前後に余分なスペースや引用符を入れないでください

---

## 手順3: データベーステーブルの作成

### 3.1 SQL Editorを開く

1. Supabase Dashboard の左サイドバーから「**SQL Editor**」をクリック
2. 「**New query**」をクリック

### 3.2 SQLを実行

1. プロジェクト内の `supabase-schema.sql` ファイルを開く
2. ファイルの内容をすべてコピー
3. SQL Editorに貼り付け
4. 「**Run**」ボタン（または `Cmd+Enter` / `Ctrl+Enter`）をクリック

### 3.3 実行結果の確認

成功すると、以下のメッセージが表示されます：

```
Success. No rows returned
```

### 3.4 テーブルの確認

1. 左サイドバーから「**Table Editor**」をクリック
2. `documents` と `chunks` テーブルが表示されていることを確認

---

## ✅ セットアップ完了の確認

以下のコマンドで環境変数が正しく設定されているか確認できます：

```bash
# 環境変数の確認（値は表示されませんが、設定されているか確認できます）
node -e "console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定')"
```

---

## 🚨 トラブルシューティング

### エラー: "Missing Supabase environment variables"

- `.env.local` ファイルがプロジェクトルートにあるか確認
- 環境変数名に `NEXT_PUBLIC_` プレフィックスが付いているか確認
- Next.jsの開発サーバーを再起動（`.env.local` の変更は再起動が必要）

### エラー: "relation does not exist"

- SQL Editorで `supabase-schema.sql` が正しく実行されたか確認
- Table Editorでテーブルが作成されているか確認

### SQL実行エラー: "extension vector does not exist"

- Supabaseのプロジェクトでpgvector拡張が有効になっているか確認
- 一部の無料プランではpgvectorが利用できない場合があります

---

## 📚 参考資料

- `supabase-setup.md` - 簡易セットアップ手順
- `SUPABASE_SCHEMA.md` - テーブル構造の詳細
- `supabase-schema.sql` - 実行用SQLファイル

