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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">文書アップロード</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label
              htmlFor="file-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              PDFファイル
            </label>
            <input
              id="file-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={loading}
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                選択中: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="title-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              文書タイトル（オプション）
            </label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ファイル名から自動設定されます"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'アップロード中...' : 'アップロード'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/ask')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              質問画面へ
            </button>
          </div>
        </form>

        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">アップロード手順</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
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

