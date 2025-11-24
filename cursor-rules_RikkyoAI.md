# cursor-rules.md
## プロジェクト概要
- 本リポジトリは「社内文書AIシステム（RAG）」の Web アプリケーションです。
- 技術スタック：
  - Next.js 14（App Router）
  - TypeScript
  - Supabase（Postgres + pgvector）
  - OpenAI API（Embedding + Chat Completions）

---

## 1. 一般方針
1. 既存のディレクトリ構成（app/lib/components/scripts/types）を尊重し、不要な大改造は行わない。
2. 新機能を追加する場合は、まず `lib` にロジック、`app` / `components` にUIを分離して配置する。
3. コード例は **TypeScript + ES Modules** で書き、CommonJS は使用しない。
4. 変更多発よりも、**小さく安全な差分** を優先する。

---

## 2. コードスタイル

### 2.1 TypeScript / Next.js
- `any` の乱用を避ける。型が不明な場合は `unknown` や明示的な型定義を検討する。
- 型定義は `types/` ディレクトリにまとめ、複数箇所で使う型はそこで管理する。
- Reactコンポーネントは原則 `function ComponentName() {}` の形式を使う。

### 2.2 命名規則
- ファイル・コンポーネント名：`PascalCase`（例：`QuestionForm.tsx`）
- 関数・変数名：`camelCase`
- 型・インターフェース名：`PascalCase`（例：`DocumentChunk`）

### 2.3 コメント
- ビジネスロジックやRAGの重要部分には、簡潔な日本語コメントを1〜2行付ける。
- 自明な処理には不要なコメントを増やさない。

---

## 3. RAG ロジックに関するルール

1. RAGの中核ロジックは `lib/rag.ts` に集約する。
   - 質問 → Embedding生成 → ベクトル検索 → プロンプト構築 の流れをここに置く。
2. Embedding生成ロジックは `lib/embeddings.ts` に分離し、再利用可能にする。
3. Supabase接続は `lib/supabase.ts` に統一し、API内で直接クライアントを生成しない。
4. RAGのプロンプトは、以下を基本テンプレートとする（必要に応じて拡張）：
   - system: 役割（社内情報アシスタント）
   - context: 検索されたチャンク一覧
   - user: 質問文

---

## 4. API 実装ルール（app/api）

1. `app/api/ask/route.ts`
   - 入力：`{ question: string }`
   - 処理：RAGロジックを呼び出し、LLM回答＋根拠を返す。
   - 出力：`{ answer: string, sources: Array<ChunkSummary> }`
2. `app/api/admin/ingest/route.ts`
   - 入力：アップロードされた文書情報
   - 処理：テキスト抽出 → チャンク化 → Embedding生成 → DB保存
   - エラー時はHTTPステータスコードとメッセージを返す。

3. API では、エラーを `try/catch` で捕捉し、わかりやすい JSON レスポンスを返す：
   ```ts
   return NextResponse.json({ error: "MESSAGE" }, { status: 400 });
   ```

---

## 5. 環境変数・秘密情報

1. APIキー（`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` 等）は `.env.local` に格納し、コード中にベタ書きしない。
2. 環境変数の読み取りは `lib/*` 内で行い、アクセス時には存在チェックを行う。
3. Cursor は環境変数名を変えない。新しく追加する際は、既存の命名規則（大文字＋アンダースコア）に従う。

---

## 6. コンポーネント（components ディレクトリ）

1. UI コンポーネントは `components/` 配下に配置し、ロジック（RAG / DBアクセス）は `lib/` に置く。
2. 再利用を前提としたコンポーネントには Props の型定義を必ず付ける。
   ```ts
   type QuestionFormProps = {
     onSubmit: (question: string) => void;
   };
   ```
3. 状態管理が重くなる場合は、`app` ではなく `components` 内でローカルステートを管理し、必要に応じて Context を検討する。

---

## 7. スクリプト（scripts ディレクトリ）

1. 一括インポートやメンテナンス用スクリプトは `scripts/` に配置する。
2. `ts-node` などで実行可能な形式で記述する。
3. 本番運用に影響するスクリプトは、実行時に確認プロンプトを出すか、`--force` オプションなどの明示的なフラグが必要になるようにする。

---

## 8. テスト・検証

1. 単体テスト・統合テストは今後追加予定。現時点では重要ロジック（RAG, Embedding）は最優先でテスト対象とする。
2. テストフレームワークを導入する場合は `vitest` or `jest` を想定し、`package.json` にスクリプトを追加する。
3. 大きな変更を加えた場合は、最低限の動作確認（質問→回答の一連の流れ）を手動テストする。

---

## 9. Cursor の振る舞いに関するルール

1. 大きなリファクタ提案よりも、ユーザーが依頼したタスクにフォーカスして変更を行う。
2. ファイルを書き換える際は、**既存の関数や型のインターフェースを極力壊さない**。
3. 新しいユーティリティ関数や型は、重複がないか確認した上で `lib/` または `types/` に追加する。
4. ユーザーから特に依頼がない限り、新しい外部ライブラリの追加は提案ベースに留め、勝手に `package.json` を変更しない。
