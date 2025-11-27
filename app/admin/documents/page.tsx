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
  file_path?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchDocuments()
    // ウィンドウがフォーカスされた時も再取得（タブ切り替え時の更新）
    const handleFocus = () => {
      fetchDocuments()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      setMessage(null)
      console.log('[Documents] 文書一覧を取得中...')
      
      // タイムスタンプを追加してキャッシュを回避
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/documents?t=${timestamp}`, {
        cache: 'no-store', // キャッシュを無効化して最新データを取得
        headers: {
          'Cache-Control': 'no-cache',
        },
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

  const handleRegenerate = async (documentId: string) => {
    if (!confirm('この文書のEmbeddingを再生成しますか？\n（処理には時間がかかる場合があります）')) {
      return
    }

    setRegenerating(documentId)
    setMessage(null)
    setError(null)

    try {
      console.log('[Documents] Embedding再生成開始:', documentId)
      const response = await fetch(`/api/admin/documents/${documentId}/regenerate`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '再生成に失敗しました')
      }

      setMessage({
        type: 'success',
        text: data.message || 'Embeddingの再生成が完了しました',
      })

      // 文書一覧を再読み込み
      fetchDocuments()
    } catch (err) {
      console.error('再生成エラー:', err)
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました'
      setError(errorMessage)
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setRegenerating(null)
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
    <div className="min-h-screen p-8 bg-wood-pattern relative overflow-hidden">
      {/* 背景装飾 - 木の年輪のようなアニメーション */}
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

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12 animate-fadeIn">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-wood-dark animate-grow"></div>
            <h1 className="text-5xl font-bold mb-3 text-wood-dark tracking-tight relative">
              <span className="relative z-10 bg-wood-pattern px-4 py-2 rounded-lg border-4 border-wood-dark shadow-wood-lg inline-block transform hover:scale-105 transition-transform">
                文書アーカイブ
              </span>
            </h1>
            <p className="text-wood-darker text-sm font-mono mt-3 ml-4 tracking-wider">
              📚 Document Archive Tree
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="px-6 py-3 bg-wood-light text-wood-dark border-4 border-wood-dark font-bold hover:bg-wood-lighter disabled:bg-wood-darkest disabled:cursor-not-allowed shadow-wood-md transition-all transform hover:scale-105 hover:shadow-wood-lg disabled:transform-none rounded-lg"
            >
              <span className="inline-block animate-spin-slow">🔄</span> 更新
            </button>
            <Link
              href="/admin/upload"
              className="px-8 py-3 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker shadow-wood-md transition-all transform hover:scale-105 hover:shadow-wood-lg rounded-lg"
            >
              + 新規アップロード
            </Link>
          </div>
        </div>

        {loading && (
          <div className="text-center py-20 border-4 border-dashed border-wood-dark bg-wood-light rounded-lg shadow-wood-md animate-fadeIn">
            <div className="inline-block animate-pulse-gentle mb-4 text-6xl">🌳</div>
            <p className="text-wood-dark font-bold text-lg">読み込み中...</p>
            <p className="text-wood-darker text-sm font-mono mt-2">Loading Archive...</p>
          </div>
        )}

        {message && (
          <div
            className={`mb-6 p-6 border-4 shadow-wood-md rounded-lg animate-slideDown ${
              message.type === 'success'
                ? 'bg-green-100 border-green-700 text-green-900'
                : 'bg-red-100 border-red-700 text-red-900'
            }`}
          >
            <div className="font-bold mb-2 text-lg">{message.type === 'success' ? '✅ 成功' : '❌ エラー'}</div>
            <div className="font-medium">{message.text}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-6 bg-red-100 border-4 border-red-700 text-red-900 shadow-wood-md rounded-lg animate-slideDown">
            <div className="font-bold mb-2 text-lg">❌ エラー</div>
            <div className="font-medium">{error}</div>
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="text-center py-20 border-4 border-dashed border-wood-dark bg-wood-light rounded-lg shadow-wood-md animate-fadeIn">
            <div className="text-6xl mb-4 animate-bounce-slow">📄</div>
            <p className="text-wood-dark mb-6 font-bold text-xl">アップロードされた文書がありません</p>
            <Link
              href="/admin/upload"
              className="inline-block px-8 py-4 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker shadow-wood-md transition-all transform hover:scale-105 hover:shadow-wood-lg rounded-lg"
            >
              + 文書をアップロード
            </Link>
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <div className="bg-wood-light border-4 border-wood-dark shadow-wood-lg overflow-hidden rounded-lg animate-fadeIn">
            <div className="bg-wood-dark text-wood-light px-6 py-4 border-b-4 border-wood-darker">
              <h2 className="text-xl font-bold">📚 文書リスト</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-wood-darker text-wood-light border-b-4 border-wood-darkest">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r-2 border-wood-darkest">
                      タイトル
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r-2 border-wood-darkest">
                      ファイル名
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r-2 border-wood-darkest">
                      チャンク数
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r-2 border-wood-darkest">
                      アップロード日時
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-wood-pattern divide-y-2 divide-wood-dark">
                  {documents.map((doc, index) => (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-wood-lighter transition-all transform hover:scale-[1.01] hover:shadow-wood-md"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap border-r-2 border-wood-dark">
                        <div className="text-sm font-bold text-wood-darkest flex items-center gap-2">
                          <span className="text-lg">
                            {doc.file_type === 'pdf' ? '📄' : doc.file_type === 'docx' ? '📝' : doc.file_type === 'txt' ? '📃' : '📄'}
                          </span>
                          {doc.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r-2 border-wood-dark">
                        <div className="text-sm text-wood-darker font-mono flex items-center gap-2">
                          <span className="text-xs bg-wood-dark text-wood-light px-2 py-1 rounded font-bold">
                            {doc.file_type?.toUpperCase() || 'PDF'}
                          </span>
                          {doc.file_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r-2 border-wood-dark">
                        <div className="text-sm text-wood-darker font-mono font-bold">
                          {doc.chunksCount !== undefined ? doc.chunksCount : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r-2 border-wood-dark">
                        <div className="text-sm text-wood-darker font-mono">
                          {new Date(doc.uploaded_at).toLocaleString('ja-JP')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(doc.file_type === 'pdf' || doc.file_type === 'docx' || doc.file_type === 'txt') && (
                            <a
                              href={`/api/admin/documents/${doc.id}/view`}
                              download={doc.file_name}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105 inline-block"
                              title={`${doc.file_type.toUpperCase()}をダウンロード`}
                            >
                              ⬇️ ダウンロード
                            </a>
                          )}
                          <button
                            onClick={() => handleRegenerate(doc.id)}
                            disabled={regenerating === doc.id}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105 disabled:transform-none"
                            title="Embeddingを再生成"
                          >
                            {regenerating === doc.id ? (
                              <span className="flex items-center gap-2">
                                <span className="inline-block animate-pulse-gentle">🔄</span>
                                再生成中...
                              </span>
                            ) : (
                              '🔄 再生成'
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 text-sm text-wood-darkest font-bold bg-wood-light px-6 py-3 border-4 border-wood-dark inline-block shadow-wood-md rounded-lg animate-fadeIn">
          <span className="text-lg mr-2">🌳</span>
          合計: <span className="text-2xl text-wood-darker">{documents.length}</span> 件の文書
        </div>
      </div>
    </div>
  )
}

