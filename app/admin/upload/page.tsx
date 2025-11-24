'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setMessage({ type: 'error', text: 'PDFファイルのみ対応しています' })
        return
      }
      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.pdf$/i, ''))
      }
      setMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage({ type: 'error', text: 'ファイルを選択してください' })
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'アップロードに失敗しました')
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
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '予期しないエラーが発生しました',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-stone-50">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-stone-900 tracking-tight border-b-4 border-stone-800 pb-3 inline-block">
            文書アップロード
          </h1>
          <p className="text-stone-600 text-sm font-mono mt-2">
            Upload PDF → Process → Index
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-100 p-8 border-2 border-stone-800 retro-shadow-sm">
          <div className="mb-6">
            <label
              htmlFor="file-input"
              className="block text-sm font-bold text-stone-900 mb-3 border-b border-stone-800 pb-1"
            >
              PDFファイル
            </label>
            <div className="border-2 border-stone-800 bg-stone-50 p-4 retro-shadow-sm">
              <input
                id="file-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-stone-700 file:mr-4 file:py-2 file:px-4 file:border-2 file:border-stone-800 file:bg-stone-200 file:text-stone-900 file:font-bold file:cursor-pointer hover:file:bg-stone-300 file:retro-shadow-sm"
                disabled={loading}
              />
              {file && (
                <p className="mt-3 text-sm text-stone-700 font-mono bg-stone-200 px-3 py-2 border border-stone-800">
                  選択中: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="title-input"
              className="block text-sm font-bold text-stone-900 mb-3 border-b border-stone-800 pb-1"
            >
              文書タイトル（オプション）
            </label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ファイル名から自動設定されます"
              className="w-full px-5 py-3 border-2 border-stone-800 bg-stone-50 text-stone-900 placeholder-stone-500 focus:outline-none focus:bg-white focus:border-stone-900 font-medium retro-shadow-sm"
              disabled={loading}
            />
          </div>

          {message && (
            <div
              className={`mb-6 p-5 border-2 retro-shadow-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-800 text-green-900'
                  : 'bg-red-50 border-red-800 text-red-900'
              }`}
            >
              <div className="font-bold mb-1">{message.type === 'success' ? '成功' : 'エラー'}</div>
              <div className="text-sm">{message.text}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-6 py-4 bg-stone-900 text-stone-50 border-2 border-stone-800 font-bold hover:bg-stone-800 disabled:bg-stone-400 disabled:border-stone-400 disabled:cursor-not-allowed retro-shadow-sm transition-all"
            >
              {loading ? 'アップロード中...' : 'アップロード'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/ask')}
              className="px-6 py-4 bg-stone-200 text-stone-900 border-2 border-stone-800 font-bold hover:bg-stone-300 retro-shadow-sm transition-all"
            >
              質問画面へ
            </button>
          </div>
        </form>

        <div className="mt-8 bg-stone-200 p-6 border-2 border-stone-800 retro-shadow-sm">
          <h2 className="text-lg font-bold mb-3 text-stone-900 border-b-2 border-stone-800 pb-2 inline-block">
            アップロード手順
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-stone-800 leading-relaxed">
            <li>PDFファイルを選択してください</li>
            <li>文書タイトルを入力（オプション）</li>
            <li>「アップロード」ボタンをクリック</li>
            <li>処理が完了すると、自動的にチャンク分割とEmbedding生成が行われます</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

