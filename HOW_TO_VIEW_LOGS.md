# ログの確認方法

Rikkyo AIシステムのログを確認する方法を説明します。

---

## 📊 Vercelのログ確認方法

### 方法1: Vercel Dashboard（推奨）

1. **Vercel Dashboardにアクセス**
   - https://vercel.com/dashboard を開く
   - ログイン（まだの場合はアカウントを作成）

2. **プロジェクトを選択**
   - プロジェクト一覧から「RikkyoAI」または「rikkyo-ai」をクリック

3. **Deploymentsタブを開く**
   - 上部のタブから「Deployments」をクリック
   - 最新のデプロイメントをクリック

4. **Functionsタブを開く**
   - デプロイメント詳細画面で「Functions」タブをクリック
   - または、左側のメニューから「Functions」を選択

5. **APIエンドポイントのログを確認**
   - `/api/ask` をクリックして検索APIのログを確認
   - `/api/admin/ingest` をクリックしてアップロードAPIのログを確認
   - `/api/search-history` をクリックして履歴APIのログを確認

6. **リアルタイムログの確認**
   - 「Real-time Logs」ボタンをクリック
   - リアルタイムでログが表示されます
   - 検索を実行すると、ログがリアルタイムで表示されます

### 方法2: Vercel CLI

1. **Vercel CLIをインストール**（まだの場合）
   ```bash
   npm i -g vercel
   ```

2. **ログイン**
   ```bash
   vercel login
   ```

3. **プロジェクトにリンク**
   ```bash
   cd "/Users/suzutaku/Desktop/iOS_App_Development/Rikkyo AI"
   vercel link
   ```

4. **ログを表示**
   ```bash
   vercel logs
   ```
   
   または、特定のデプロイメントのログを表示：
   ```bash
   vercel logs [deployment-url]
   ```

---

## 🔍 確認すべきログメッセージ

### 検索API (`/api/ask`) のログ

正常な場合のログ例：
```
質問を受信: 社内規程について教えてください
類似チャンクの検索を開始...
[RAG] 質問のEmbedding生成を開始: "社内規程について教えてください"
[RAG] Embedding生成完了。次元数: 3072
[RAG] RPC関数を呼び出し中...
[RAG] RPC関数から 5件のチャンクを取得
[RAG] 関連文書ID: 2件
検索結果: 5件のチャンクが見つかりました
LLM回答生成を開始...
LLM回答生成完了
検索履歴を保存しました
```

エラーの場合のログ例：
```
質問を受信: 社内規程について教えてください
類似チャンクの検索を開始...
[RAG] 質問のEmbedding生成を開始: "社内規程について教えてください"
[RAG] Embedding生成完了。次元数: 3072
[RAG] RPC関数を呼び出し中...
[RAG] RPC関数エラー: { message: '...', code: '...' }
[RAG] RPC関数が存在しないかエラーが発生したため、クライアント側でベクトル検索を実行します
取得したチャンク数: 712
有効なチャンク: 712, 無効なチャンク: 0
類似度計算後のチャンク数: 10
```

### フォールバック処理のログ

RPC関数から結果が返されない場合：
```
[RAG] RPC関数から 0件のチャンクを取得
[RAG] RPC関数からチャンクが返されませんでした（閾値が高すぎる可能性があります）
[RAG] フォールバック処理に移行します
[RAG] フォールバック: 取得したチャンク数: 712
[RAG] フォールバック: 有効なチャンク: 712, 無効なチャンク: 0
[RAG] フォールバック: 類似度計算後のチャンク数: 10
[RAG] フォールバック処理の結果を返します: 10件
```

---

## 🐛 エラーログの確認方法

### 1. Vercel Dashboardでエラーを確認

1. Vercel Dashboard → Deployments → 最新のデプロイ → Functions
2. エラーが発生したAPIエンドポイントをクリック
3. エラーログを確認（赤色で表示されます）

### 2. ブラウザのコンソールでエラーを確認

1. アプリケーションを開く（https://rikkyo-ai.vercel.app）
2. ブラウザの開発者ツールを開く
   - Chrome/Edge: `F12` または `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: `F12` または `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - Safari: `Cmd+Option+I` (Mac)
3. 「Console」タブを開く
4. エラーメッセージを確認

### 3. ネットワークタブでAPIレスポンスを確認

1. ブラウザの開発者ツールを開く
2. 「Network」タブを開く
3. 検索を実行
4. `/api/ask` のリクエストをクリック
5. 「Response」タブでAPIのレスポンスを確認
6. エラーメッセージが含まれているか確認

---

## 📝 ログの見方

### ログレベルの見分け方

- **`[info]` または通常のログ**: 正常な動作のログ
- **`[error]` または `[RAG]`**: エラーや重要な情報のログ
- **`[warn]`**: 警告メッセージ（動作は続行される）

### 重要なログメッセージ

検索が動作しない場合、以下のログを確認してください：

1. **`[RAG] RPC関数エラー:`**
   - RPC関数の呼び出しでエラーが発生
   - エラーメッセージを確認

2. **`[RAG] RPC関数から 0件のチャンクを取得`**
   - RPC関数は呼び出せたが、結果が0件
   - 閾値が高すぎる可能性

3. **`有効なチャンク: 0, 無効なチャンク: 712`**
   - Embeddingの形式に問題がある可能性
   - チャンクの次元数が一致していない可能性

4. **`検索エラー:`**
   - 検索処理全体でエラーが発生
   - エラーメッセージを確認

---

## 🔧 ログを活用したトラブルシューティング

### 問題1: 検索結果が0件になる

**確認すべきログ:**
- `[RAG] RPC関数から X件のチャンクを取得`
- `有効なチャンク: X, 無効なチャンク: Y`

**対処法:**
- RPC関数の閾値を下げる（`match_threshold`を0.5以下に）
- フォールバック処理が動作しているか確認

### 問題2: RPC関数のエラー

**確認すべきログ:**
- `[RAG] RPC関数エラー:`

**対処法:**
- RPC関数が正しく作成されているか確認
- Supabase Dashboard → Database → Functions → `match_chunks`を確認

### 問題3: Embedding生成エラー

**確認すべきログ:**
- `[RAG] Embedding生成完了。次元数: X`
- `Embedding生成エラー:`

**対処法:**
- OpenAI APIキーが正しく設定されているか確認
- Vercelの環境変数で`OPENAI_API_KEY`を確認

---

## 💡 ログの保存方法

### Vercel Dashboardからログをエクスポート

1. Vercel Dashboard → Deployments → 最新のデプロイ → Functions
2. ログをコピー＆ペーストして保存

### ブラウザのコンソールからログを保存

1. ブラウザの開発者ツールを開く
2. Consoleタブで右クリック → 「Save as...」で保存
   - または、ログをコピーしてテキストファイルに保存

---

## 📚 参考資料

- [Vercel公式ドキュメント - Logs](https://vercel.com/docs/observability/logs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

---

更新日: 2025-11-26

