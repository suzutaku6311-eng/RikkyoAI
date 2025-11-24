'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Document = {
  id: string
  title: string
  file_name: string
  file_type: string
  uploaded_at: string
  chunksCount?: number
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/documents')
      
      if (!response.ok) {
        throw new Error('文書の取得に失敗しました')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('この文書を削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      // リストを更新
      fetchDocuments()
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  return (
    <div className="min-h-screen p-8 bg-stone-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-stone-900 tracking-tight border-b-4 border-stone-800 pb-3 inline-block">
              文書一覧
            </h1>
            <p className="text-stone-600 text-sm font-mono mt-2">
              Document Index
            </p>
          </div>
          <Link
            href="/admin/upload"
            className="px-6 py-3 bg-stone-900 text-stone-50 border-2 border-stone-800 font-bold hover:bg-stone-800 retro-shadow-sm transition-all"
          >
            + 新規アップロード
          </Link>
        </div>

        {loading && (
          <div className="text-center py-16 border-2 border-dashed border-stone-400 bg-stone-100">
            <p className="text-stone-600 font-medium">読み込み中...</p>
            <p className="text-stone-500 text-sm font-mono mt-2">Loading...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-800 text-red-900 retro-shadow-sm">
            <div className="font-bold mb-1">エラー</div>
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-stone-400 bg-stone-100">
            <p className="text-stone-600 mb-4 font-medium">アップロードされた文書がありません</p>
            <Link
              href="/admin/upload"
              className="inline-block px-6 py-3 bg-stone-900 text-stone-50 border-2 border-stone-800 font-bold hover:bg-stone-800 retro-shadow-sm transition-all"
            >
              文書をアップロード
            </Link>
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <div className="bg-stone-100 border-2 border-stone-800 retro-shadow-sm overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-stone-200 border-b-2 border-stone-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-900 uppercase tracking-wider border-r-2 border-stone-800">
                    タイトル
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-900 uppercase tracking-wider border-r-2 border-stone-800">
                    ファイル名
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-900 uppercase tracking-wider border-r-2 border-stone-800">
                    チャンク数
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-900 uppercase tracking-wider border-r-2 border-stone-800">
                    アップロード日時
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-stone-900 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-stone-50 divide-y-2 divide-stone-800">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-stone-200 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap border-r-2 border-stone-800">
                      <div className="text-sm font-bold text-stone-900">
                        {doc.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r-2 border-stone-800">
                      <div className="text-sm text-stone-700 font-mono">{doc.file_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r-2 border-stone-800">
                      <div className="text-sm text-stone-700 font-mono">
                        {doc.chunksCount !== undefined ? doc.chunksCount : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r-2 border-stone-800">
                      <div className="text-sm text-stone-700 font-mono">
                        {new Date(doc.uploaded_at).toLocaleString('ja-JP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-800 hover:text-red-900 font-bold border-b-2 border-red-800 hover:border-red-900 transition-colors"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-sm text-stone-700 font-mono bg-stone-200 px-4 py-2 border-2 border-stone-800 inline-block retro-shadow-sm">
          合計: {documents.length}件の文書
        </div>
      </div>
    </div>
  )
}

