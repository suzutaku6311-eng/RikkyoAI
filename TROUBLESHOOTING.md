# トラブルシューティング

## 開発サーバーが起動しない / ブラウザで開けない

### 1. ポート3000が使用されている場合

```bash
# ポート3000を使用しているプロセスを確認
lsof -i:3000

# プロセスを終了（PIDを確認してから）
kill -9 <PID>

# または別のポートで起動
PORT=3001 npm run dev
```

### 2. 開発サーバーを再起動

```bash
# 現在のプロセスを停止（Ctrl+C）
# その後、再起動
npm run dev
```

### 3. ブラウザで開けない場合

- **URLを確認**: `http://localhost:3000` が正しいか確認
- **別のブラウザで試す**: Chrome、Firefox、Safariなど
- **プライベートモードで試す**: ブラウザの拡張機能が干渉している可能性
- **ファイアウォールを確認**: ローカルホストへの接続がブロックされていないか

### 4. エラーログを確認

ターミナルに表示されるエラーメッセージを確認してください。

よくあるエラー：

- **"Port 3000 is already in use"**: ポート3000が既に使用されています
- **"Cannot find module"**: 依存関係がインストールされていません → `npm install`
- **"Environment variables missing"**: `.env.local`ファイルが正しく設定されていません

### 5. クリーンインストール

```bash
# node_modulesとキャッシュを削除
rm -rf node_modules .next

# 依存関係を再インストール
npm install

# 開発サーバーを起動
npm run dev
```

### 6. 環境変数の確認

`.env.local`ファイルが正しく設定されているか確認：

```bash
cat .env.local
```

以下の環境変数が設定されている必要があります：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

## その他の問題

### Internal Server Error

1. ブラウザの開発者ツール（F12）でエラーを確認
2. ターミナルのエラーログを確認
3. Supabaseの接続を確認: `npm run test:supabase`

### PDFアップロードが失敗する

1. ファイルサイズを確認（大きすぎる場合はエラーになる可能性）
2. PDFファイルが正しい形式か確認
3. Supabaseのテーブルが正しく作成されているか確認

### RAG検索が動作しない

1. まずPDFをアップロードしてデータが存在するか確認
2. Supabaseの`chunks`テーブルにデータが保存されているか確認
3. OpenAI APIキーが正しく設定されているか確認

