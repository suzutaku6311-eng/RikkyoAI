'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

export default function UploadPage() {
  const { t, language } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 認証チェック
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/admin/upload')
        return
      }
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        setMessage({ type: 'error', text: language === 'ja' ? '管理者権限が必要です' : 'Admin privileges required' })
        return
      }
    }
  }, [user, authLoading, router, language])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
    // ファイルタイプのチェック
    const fileName = selectedFile.name.toLowerCase()
    const fileType = selectedFile.type
    const isPdf = fileName.endsWith('.pdf') || fileType === 'application/pdf'
    const isDocx = fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    const isTxt = fileName.endsWith('.txt') || fileType === 'text/plain'
    const isXlsx = fileName.endsWith('.xlsx') || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    const isXls = fileName.endsWith('.xls') || fileType === 'application/vnd.ms-excel'
    
    if (!isPdf && !isDocx && !isTxt && !isXlsx && !isXls) {
      setMessage({ type: 'error', text: language === 'ja' ? 'PDF、DOCX、TXT、Excel（XLSX/XLS）ファイルのみ対応しています' : 'Only PDF, DOCX, TXT, and Excel (XLSX/XLS) files are supported' })
      return
    }

      // ファイルサイズのチェック（Vercel無料プランの制限: 4.5MB）
      const maxSize = 4.5 * 1024 * 1024 // 4.5MB
      if (selectedFile.size > maxSize) {
        const errorMsg = t('language') === 'ja' 
          ? `ファイルサイズが大きすぎます。最大4.5MBまで対応しています。現在のサイズ: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`
          : `File size is too large. Maximum 4.5MB supported. Current size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`
        setMessage({ 
          type: 'error', 
          text: errorMsg
        })
        return
      }

      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.(pdf|docx|txt|xlsx|xls)$/i, ''))
      }
      setMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage({ type: 'error', text: language === 'ja' ? 'ファイルを選択してください' : 'Please select a file' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (title.trim()) {
        formData.append('title', title.trim())
      }

      const response = await fetch('/api/admin/ingest', {
        method: 'POST',
        body: formData,
      })

      console.log('[Upload] レスポンス受信:', response.status, response.statusText)

      // ステータスコードに応じたエラーハンドリング
      if (response.status === 413) {
        throw new Error(language === 'ja' 
          ? 'ファイルサイズが大きすぎます。Vercel無料プランの制限により、4.5MB以下のファイルのみアップロードできます。'
          : 'File size is too large. Due to Vercel free plan limitations, only files up to 4.5MB can be uploaded.')
      }

      if (response.status === 404) {
        throw new Error(language === 'ja' 
          ? 'APIエンドポイントが見つかりません。ページをリロードして再度お試しください。'
          : 'API endpoint not found. Please reload the page and try again.')
      }

      // レスポンスのContent-Typeを確認
      const contentType = response.headers.get('content-type')
      let data: any = {}

      if (contentType && contentType.includes('application/json')) {
        // JSONレスポンスの場合
        try {
          data = await response.json()
        } catch (jsonError) {
          const text = await response.text()
          console.error('[Upload] JSON解析エラー:', text)
          throw new Error(`JSON解析エラー: ${text.substring(0, 200)}`)
        }
      } else {
        // JSONでない場合（エラーメッセージなど）
        const text = await response.text()
        console.error('[Upload] 非JSONレスポンス:', text)
        throw new Error(`サーバーエラー (${response.status}): ${text.substring(0, 200)}`)
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `アップロードに失敗しました (${response.status})`)
      }

      setMessage({
        type: 'success',
        text: `アップロード成功！文書ID: ${data.documentId}, チャンク数: ${data.chunksCount}`,
      })

      // フォームをリセット
      setFile(null)
      setTitle('')
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      // 3秒後に文書一覧ページにリダイレクト（タイムスタンプ付きでキャッシュを回避）
      setTimeout(() => {
        router.push(`/admin/documents?t=${Date.now()}`)
      }, 3000)
    } catch (err) {
      console.error('アップロードエラー:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : (language === 'ja' ? '予期しないエラーが発生しました' : 'An unexpected error occurred'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-wood-pattern relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full animate-pulse-slow"
          style={{
            background: 'radial-gradient(circle, rgba(212, 196, 168, 0.2) 0%, transparent 50%, transparent 100%)'
          }}
        ></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-wood-dark/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-wood-darker/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-10 animate-fadeIn">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-wood-dark animate-grow"></div>
            <h1 className="text-5xl font-bold mb-3 text-wood-dark tracking-tight relative">
              <span className="relative z-10 bg-wood-pattern px-4 py-2 rounded-lg border-4 border-wood-dark shadow-wood-lg inline-block transform hover:scale-105 transition-transform">
                {t('upload.title')}
              </span>
            </h1>
            <p className="text-wood-darker text-sm font-mono mt-3 ml-4 tracking-wider">
              {t('upload.subtitle')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-wood-light p-8 border-4 border-wood-dark shadow-wood-md rounded-lg animate-fadeIn">
          <div className="mb-6">
            <label
              htmlFor="file-input"
              className="block text-sm font-bold text-wood-darkest mb-3 border-b-4 border-wood-dark pb-2"
            >
              {t('upload.file.label')}
            </label>
            <div className="border-4 border-wood-dark bg-white/50 p-4 rounded-lg shadow-wood-sm">
              <div className="flex items-center gap-4">
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.docx,.txt,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <label
                  htmlFor="file-input"
                  className="px-6 py-3 bg-wood-light text-wood-darkest border-4 border-wood-dark font-bold cursor-pointer hover:bg-wood-lightest shadow-wood-sm rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {t('upload.file.selectButton')}
                </label>
                {file ? (
                  <p className="flex-1 text-sm text-wood-darkest font-mono bg-wood-light px-4 py-2 border-2 border-wood-dark rounded-lg shadow-wood-sm">
                    {t('upload.file.selected')}: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="flex-1 text-sm text-wood-darker font-mono bg-wood-light/50 px-4 py-2 border-2 border-wood-dark/50 rounded-lg">
                    {t('upload.file.notSelected')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="title-input"
              className="block text-sm font-bold text-wood-darkest mb-3 border-b-4 border-wood-dark pb-2"
            >
              {t('upload.title.label')}
            </label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('upload.title.placeholder')}
              className="w-full px-6 py-4 border-4 border-wood-dark bg-wood-light text-wood-darkest placeholder-wood-darker focus:outline-none focus:bg-white focus:border-wood-darker font-medium shadow-wood-sm rounded-lg text-lg"
              disabled={loading}
            />
          </div>

          {message && (
            <div
              className={`mb-6 p-6 border-4 shadow-wood-md rounded-lg animate-slideDown ${
                message.type === 'success'
                  ? 'bg-green-100 border-green-700 text-green-900'
                  : 'bg-red-100 border-red-700 text-red-900'
              }`}
            >
              <div className="font-bold mb-2 text-lg flex items-center gap-2">
                {message.type === 'success' ? t('upload.success') : t('upload.error')}
              </div>
              <div className="text-sm font-medium">{message.text}</div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-8 py-5 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker disabled:bg-wood-darkest disabled:border-wood-darkest disabled:cursor-not-allowed shadow-wood-md transition-all transform hover:scale-105 disabled:transform-none rounded-lg text-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="inline-block animate-pulse-gentle">📤</span>
                  {t('upload.button.loading')}
                </span>
              ) : (
                t('upload.button')
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/ask')}
              className="px-8 py-5 bg-wood-light text-wood-darkest border-4 border-wood-dark font-bold hover:bg-wood-lightest shadow-wood-md transition-all transform hover:scale-105 rounded-lg text-lg"
            >
              {t('upload.button.toSearch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

