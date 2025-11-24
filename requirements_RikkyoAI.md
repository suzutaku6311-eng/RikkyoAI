# 社内文書AIシステム（RAG） 要件定義書
バージョン: 1.0
作成者: ChatGPT
目的: 社内文書（PDF・マニュアル・議事録）をもとに回答できる独自AI（RAGシステム）を構築する。

---

## 1. システム概要
本システムは、社内ドキュメントを検索し、関連情報とともに大規模言語モデル（LLM）に渡して回答を生成する RAG（Retrieval-Augmented Generation）構成を採用する。

---

## 2. 目的
- 社内PDF、規程、会議資料を横断検索し自然言語で回答できるAIを提供。
- 文書検索を高速化し業務効率を向上。
- LLMの再学習ではなく「検索＋プロンプト構築」で最新文書を扱う。

---

## 3. ステークホルダー
| 利用者 | 役割 |
|--------|------|
| 社員 | 社内文書の検索・質問 |
| 管理者 | 文書アップロード、API管理、権限設定 |
| 開発者 | バックエンド、ベクトルDB、API開発 |

---

## 4. 用語定義
- LLM：ChatGPT API or 互換モデル  
- Embedding：文章を数値ベクトル化  
- ベクトルDB：意味検索用データベース  
- チャンク：分割されたテキストブロック  
- RAG：検索情報を併せて回答する構成  

---

## 5. 機能要件

### 5.1 文書取り込み
- PDF / DOCX / TXT のアップロード  
- テキスト抽出（必要に応じてOCR）  
- チャンク分割（300〜500文字）  
- Embedding生成  
- ベクトルDBへ保存  
- 文書更新時はEmbedding再作成

---

### 5.2 RAG検索回答
- 質問をEmbedding化  
- 類似チャンクを上位5〜10件検索  
- 取得文書をプロンプトへ挿入  
- LLMへ回答依頼  
- 回答＋根拠文書を返す（任意）

---

### 5.3 セキュリティ
- 社内認証（SSO推奨）  
- 文書ごとの閲覧権限設定  
- 履歴暗号化  
- LLM送信内容の非ログ化設定  

---

### 5.4 管理機能
- 文書一覧・削除・更新  
- Embedding再生成  
- ユーザー履歴ログ  
- APIキー管理  

---

## 6. 非機能要件
### 性能
- ベクトル検索：100ms以下  
- 回答生成：2〜7秒  
- 文書取り込み：1文書60秒以内  

### 拡張性
- 文書増加後も検索精度と速度を維持  
- モデル差し替え可能（GPT→Claude→自前LLM）  

### 保守性
- 言語：TypeScript（Next.js） or Python（FastAPI）  
- DB：Supabase（pgvector）  
- 文書取り込みのログ保持  

---

## 7. 技術構成案

### 7.1 Next.js + Supabase + ChatGPT
```
ユーザー
 ↓
Next.jsフロント
 ↓
API（Edge Functions）
 1. ベクトル検索
 2. プロンプト生成
 3. ChatGPT API呼び出し
 ↓
回答
```

### 7.2 使用コンポーネント
- **フロント**：Next.js / TailwindCSS  
- **バックエンド**：Next.js API Routes or FastAPI  
- **Embedding**：OpenAI text-embedding-3-large  
- **LLM**：GPT-4o / GPT-4o mini  
- **DB**：Supabase Postgres（pgvector）  

---

## 8. 開発フロー
1. 文書収集  
2. 前処理（抽出・チャンク化）  
3. Embedding生成  
4. ベクトル検索  
5. プロンプト生成  
6. LLM回答生成  
7. ログ保存  

---

## 9. 将来拡張
- Notion / Google Drive 自動同期  
- 会話履歴の永続化  
- モデル切替（GPT/Claude/LLAMA）  
- スマホアプリ連携  

---

## 10. リスク
| リスク | 対策 |
|--------|------|
| 権限漏洩 | アクセス制御・RLS |
| 誤回答 | 文書にない場合は「不明」と答える指示 |
| モデル依存 | モデル抽象レイヤーで差し替え対応 |

---

## 11. ディレクトリ構成（案）

本プロジェクトは Next.js 14（App Router） + Supabase + OpenAI を前提とした構成とする。

```txt
project-root/
├─ app/
│  ├─ layout.tsx                # 共通レイアウト
│  ├─ page.tsx                  # トップページ（概要・説明）
│  ├─ ask/
│  │  └─ page.tsx              # 質問UI（RAG検索画面）
│  ├─ admin/
│  │  └─ upload/
│  │     └─ page.tsx           # 文書アップロード画面
│  ├─ api/
│  │  ├─ ask/
│  │  │  └─ route.ts           # 質問→RAG→LLM回答API
│  │  └─ admin/
│  │     └─ ingest/
│  │        └─ route.ts        # 文書アップロード→Embedding生成API
│
├─ components/
│  ├─ QuestionForm.tsx          # 質問入力フォーム
│  ├─ AnswerPanel.tsx           # 回答・根拠表示コンポーネント
│  ├─ UploadForm.tsx            # 文書アップロード用フォーム
│  └─ LayoutHeader.tsx          # 共通ヘッダーなど
│
├─ lib/
│  ├─ openai.ts                 # OpenAIクライアントラッパ
│  ├─ supabase.ts               # Supabaseクライアント初期化
│  ├─ embeddings.ts             # Embedding生成ロジック
│  ├─ rag.ts                    # 質問→検索→プロンプト生成の中核ロジック
│  └─ auth.ts                   # 認証・権限チェック（必要に応じて）
│
├─ scripts/
│  └─ ingest-local-docs.ts      # ローカル文書の一括インポートスクリプト
│
├─ types/
│  └─ documents.ts              # Document / Chunk / Embedding などの型定義
│
├─ public/
│  └─ ...                       # ロゴ・アイコンなど静的ファイル
│
├─ .env.local                   # OPENAI_API_KEY / SUPABASE_URL / SUPABASE_KEY など
├─ package.json
├─ tsconfig.json
├─ next.config.js
├─ requirements.md              # 本ファイル
└─ cursor-rules.md              # Cursor用ルール定義
```

- `app/api/*` 以下は **APIエンドポイント** として RAG/インポートを実装する。
- `lib/*` は **ロジック層**（OpenAI・Supabase・RAGの共通処理）をまとめる。
- `components/*` は **UIコンポーネント** をまとめ、再利用性を高める。
- `scripts/*` は運用・メンテナンス用の一括処理（バッチ）を配置する。
