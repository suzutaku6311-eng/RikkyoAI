'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'ja' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 翻訳データ
const translations = {
  ja: {
    // 共通
    'app.name': 'Rikkyo School in England Insight AI',
    'app.name.full': 'Rikkyo England in England Knowledge Assistant System',
    'school.name': '立教英国学院',
    'nav.search': '🔍 文書検索',
    'nav.documents': '📚 文書一覧',
    'nav.upload': '📤 文書アップロード',
    
    // トップページ
    'home.subtitle': '立教英国学院　文書検索AIシステム',
    'home.description': '学校内のPDF、規程、会議資料などをまとめて検索し、\n自然な文章でわかりやすく答えてくれる立教英国のAIアシスタントです。',
    'home.rag.description': '最新の RAG（Retrieval-Augmented Generation） 技術を用いて、\n必要な情報をすぐに見つけられるようサポートします。',
    'home.card.search.title': '🔍 文書検索',
    'home.card.search.description': '質問を入力して、立教英国学院の文書から関連情報を検索し、AIが回答を生成します。',
    'home.card.search.action': '→ 検索を開始',
    'home.card.upload.title': '📤 文書アップロード',
    'home.card.upload.description': 'PDFファイルをアップロードして、検索可能な形式に変換します。',
    'home.card.upload.action': '→ アップロードを開始',
    'home.usage.title': '📖 使い方',
    'home.usage.step1': '「文書アップロード」からPDFファイルをアップロード',
    'home.usage.step2': '「文書検索」で質問を入力して回答を取得',
    
    // 検索ページ
    'search.title': '🔍 Rikkyo School in England Insight AI',
    'search.subtitle': 'Query Documents → Generate Answer',
    'search.placeholder': '質問を入力してください（例: 社内規程について教えてください）',
    'search.button': '🔍 検索',
    'search.loading': '検索中...',
    'search.answer.title': '💡 回答',
    'search.sources.title': '📚 参照文書',
    'search.sources.count': '件',
    'search.history': '📜 履歴',
    'search.history.title': '検索履歴',
    'search.history.close': '✕ 閉じる',
    'search.history.loading': '読み込み中...',
    'search.history.empty': '検索履歴がありません',
    'search.history.delete': '削除',
    'search.empty.title': '質問を入力して、立教英国学院の文書を検索してください',
    'search.empty.subtitle': 'Enter your question above',
    'search.loading.title': '検索中...',
    'search.loading.subtitle': 'Searching Archive...',
    'search.error': '❌ エラー',
    'search.pagination.prev': '← 前へ',
    'search.pagination.next': '次へ →',
    'search.pagination.page': '/',
    'search.pagination.items': '件/ページ',
    
    // アップロードページ
    'upload.title': '📤 文書アップロード',
    'upload.subtitle': 'Upload PDF → Process → Index',
    'upload.file.label': '📄 文書ファイル（PDF / DOCX / TXT / Excel）',
    'upload.title.label': '📝 文書タイトル（オプション）',
    'upload.title.placeholder': 'ファイル名から自動設定されます',
    'upload.button': '📤 アップロード',
    'upload.button.loading': 'アップロード中...',
    'upload.button.toSearch': '🔍 質問画面へ',
    'upload.success': '✅ 成功',
    'upload.error': '❌ エラー',
    'upload.instructions.title': '📋 アップロード手順',
    'upload.instructions.step1': 'PDFファイルを選択してください',
    'upload.instructions.step2': '文書タイトルを入力（オプション）',
    'upload.instructions.step3': '「アップロード」ボタンをクリック',
    'upload.instructions.step4': '処理が完了すると、自動的にチャンク分割とEmbedding生成が行われます',
    'upload.file.selected': '選択中',
    'upload.file.notSelected': 'ファイルが選択されていません',
    
    // 文書一覧ページ
    'documents.title': '📚 文書一覧',
    'documents.subtitle': 'Document List → View → Download',
    'documents.refresh': '更新',
    'documents.upload': '+ 新規アップロード',
    'documents.table.title': 'タイトル',
    'documents.table.filename': 'ファイル名',
    'documents.table.chunks': 'チャンク数',
    'documents.table.uploaded': 'アップロード日時',
    'documents.table.actions': '操作',
    'documents.download': '⬇️ ダウンロード',
    'documents.regenerate': '🔄 再生成',
    'documents.regenerating': '再生成中...',
    'documents.delete': '削除',
    'documents.total': '合計',
    'documents.count': '件の文書',
    'documents.loading': '読み込み中...',
    'documents.empty': '文書がありません',
    'documents.empty.upload': '文書をアップロードしてください',
  },
  en: {
    // Common
    'app.name': 'Rikkyo School in England Insight AI',
    'app.name.full': 'Rikkyo England in England Knowledge Assistant System',
    'school.name': 'Rikkyo School in England',
    'nav.search': '🔍 Document Search',
    'nav.documents': '📚 Documents',
    'nav.upload': '📤 Upload',
    
    // Home page
    'home.subtitle': 'Rikkyo School in England Document Search AI System',
    'home.description': 'Search and query school documents (PDFs, regulations, meeting materials) with AI-powered natural language responses.',
    'home.rag.description': 'Using the latest RAG (Retrieval-Augmented Generation) technology to help you find the information you need quickly.',
    'home.card.search.title': '🔍 Document Search',
    'home.card.search.description': 'Enter questions to search school documents and get AI-generated answers.',
    'home.card.search.action': '→ Start Search',
    'home.card.upload.title': '📤 Upload Documents',
    'home.card.upload.description': 'Upload PDF files and convert them into searchable format.',
    'home.card.upload.action': '→ Start Upload',
    'home.usage.title': '📖 How to Use',
    'home.usage.step1': 'Upload PDF files from "Upload Documents"',
    'home.usage.step2': 'Enter questions in "Document Search" to get answers',
    
    // Search page
    'search.title': '🔍 Rikkyo School in England Insight AI',
    'search.subtitle': 'Query Documents → Generate Answer',
    'search.placeholder': 'Enter your question (e.g., Tell me about school regulations)',
    'search.button': '🔍 Search',
    'search.loading': 'Searching...',
    'search.answer.title': '💡 Answer',
    'search.sources.title': '📚 Reference Documents',
    'search.sources.count': 'documents',
    'search.history': '📜 History',
    'search.history.title': 'Search History',
    'search.history.close': '✕ Close',
    'search.history.loading': 'Loading...',
    'search.history.empty': 'No search history',
    'search.history.delete': 'Delete',
    'search.empty.title': 'Enter your question to search Rikkyo School in England documents',
    'search.empty.subtitle': 'Enter your question above',
    'search.loading.title': 'Searching...',
    'search.loading.subtitle': 'Searching Archive...',
    'search.error': '❌ Error',
    'search.pagination.prev': '← Previous',
    'search.pagination.next': 'Next →',
    'search.pagination.page': '/',
    'search.pagination.items': 'items/page',
    
    // Upload page
    'upload.title': '📤 Upload Documents',
    'upload.subtitle': 'Upload PDF → Process → Index',
    'upload.file.label': '📄 Document File (PDF / DOCX / TXT / Excel)',
    'upload.title.label': '📝 Document Title (Optional)',
    'upload.title.placeholder': 'Auto-set from filename',
    'upload.button': '📤 Upload',
    'upload.button.loading': 'Uploading...',
    'upload.button.toSearch': '🔍 Go to Search',
    'upload.success': '✅ Success',
    'upload.error': '❌ Error',
    'upload.instructions.title': '📋 Upload Instructions',
    'upload.instructions.step1': 'Select a PDF file',
    'upload.instructions.step2': 'Enter document title (optional)',
    'upload.instructions.step3': 'Click "Upload" button',
    'upload.instructions.step4': 'Chunking and embedding generation will be performed automatically upon completion',
    'upload.file.selected': 'Selected',
    'upload.file.notSelected': 'No file selected',
    
    // Documents page
    'documents.title': '📚 Documents',
    'documents.subtitle': 'Document List → View → Download',
    'documents.refresh': 'Refresh',
    'documents.upload': '+ New Upload',
    'documents.table.title': 'Title',
    'documents.table.filename': 'Filename',
    'documents.table.chunks': 'Chunks',
    'documents.table.uploaded': 'Uploaded',
    'documents.table.actions': 'Actions',
    'documents.download': '⬇️ Download',
    'documents.regenerate': '🔄 Regenerate',
    'documents.regenerating': 'Regenerating...',
    'documents.delete': 'Delete',
    'documents.total': 'Total',
    'documents.count': 'documents',
    'documents.loading': 'Loading...',
    'documents.empty': 'No documents',
    'documents.empty.upload': 'Please upload documents',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ja')

  // 初期化時にlocalStorageから言語設定を読み込む
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language | null
    if (savedLanguage && (savedLanguage === 'ja' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // 言語設定を変更し、localStorageに保存
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  // 翻訳関数
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.ja] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

