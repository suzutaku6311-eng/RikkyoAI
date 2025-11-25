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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      setMessage(null)
      console.log('[Documents] 文書一覧を取得中...')
      
      const response = await fetch('/api/admin/documents', {
        cache: 'no-store', // キャッシュを無効化して最新データを取得
      })
      console.log('[Documents] レスポンス受信:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'レスポンスの解析に失敗しました' }))
        console.error('[Documents] APIエラー:', errorData)
        throw new Error(errorData.error || `文書の取得に失敗しました (${response.status})`)
      }

      const data = await response.json()
      console.log('[Documents] データ受信:', { 
        documentsCount: data.documents?.length || 0,
        documents: data.documents 
      })
      
      // 状態を確実に更新
      setDocuments(data.documents || [])
    } catch (err) {
      console.error('[Documents] エラー発生:', err)
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('この文書を削除しますか？')) {
      return
    }

    // 楽観的更新: 即座にローカル状態から削除
    const deletedDocument = documents.find(doc => doc.id === documentId)
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId))
    setError(null)
    setMessage(null)

    try {
      console.log('[Documents] 削除開始:', documentId)
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE',
      })

      console.log('[Documents] 削除レスポンス:', response.status, response.statusText)

      if (!response.ok) {
        // エラーが発生した場合、削除した文書を元に戻す
        if (deletedDocument) {
          setDocuments(prevDocs => [...prevDocs, deletedDocument].sort((a, b) => 
            new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
          ))
        }
        
        const errorData = await response.json().catch(() => ({ error: 'レスポンスの解析に失敗しました' }))
        console.error('[Documents] 削除エラー:', errorData)
        const errorMessage = errorData.error || `削除に失敗しました (${response.status})`
        setError(errorMessage)
        setMessage({ type: 'error', text: errorMessage })
        return
      }

      const data = await response.json()
      console.log('[Documents] 削除成功:', data)

      // 最新の状態を取得（念のため）
      await fetchDocuments()
      
      // 成功メッセージを表示
      setMessage({ type: 'success', text: '文書を削除しました' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('[Documents] 削除エラー:', err)
      
      // エラーが発生した場合、削除した文書を元に戻す
      if (deletedDocument) {
        setDocuments(prevDocs => [...prevDocs, deletedDocument].sort((a, b) => 
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        ))
      }
      
      const errorMessage = err instanceof Error ? err.message : '削除に失敗しました'
      setError(errorMessage)
      setMessage({ type: 'error', text: errorMessage })
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
          <div className="flex gap-3">
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="px-4 py-2 bg-stone-200 text-stone-900 border-2 border-stone-800 font-bold hover:bg-stone-300 disabled:bg-stone-400 disabled:cursor-not-allowed retro-shadow-sm transition-all text-sm"
            >
              🔄 更新
            </button>
            <Link
              href="/admin/upload"
              className="px-6 py-3 bg-stone-900 text-stone-50 border-2 border-stone-800 font-bold hover:bg-stone-800 retro-shadow-sm transition-all"
            >
              + 新規アップロード
            </Link>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16 border-2 border-dashed border-stone-400 bg-stone-100">
            <p className="text-stone-600 font-medium">読み込み中...</p>
            <p className="text-stone-500 text-sm font-mono mt-2">Loading...</p>
          </div>
        )}

        {message && (
          <div
            className={`mb-6 p-5 border-2 retro-shadow-sm ${
              message.type === 'success'
                ? 'bg-green-50 border-green-800 text-green-900'
                : 'bg-red-50 border-red-800 text-red-900'
            }`}
          >
            <div className="font-bold mb-1">{message.type === 'success' ? '成功' : 'エラー'}</div>
            <div>{message.text}</div>
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

