'use client'

import { useState, useEffect } from 'react'

type Source = {
  id: string
  content: string
  documentId: string
  documentTitle?: string
  chunkIndex: number
  similarity?: number
}

type AnswerResponse = {
  answer: string
  sources: Source[]
}

type SearchHistoryItem = {
  id: string
  question: string
  answer: string
  created_at: string
}

export default function AskPage() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [sourcesPage, setSourcesPage] = useState(1)
  const [sourcesPerPage, setSourcesPerPage] = useState(5)

  // 検索履歴を読み込む
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/search-history?limit=10')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (err) {
      console.error('履歴読み込みエラー:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError(null)
    setAnswer(null)
    setSources([])

    try {
      console.log('APIリクエスト送信:', question.trim())
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      })

      console.log('APIレスポンス受信:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'レスポンスの解析に失敗しました' }))
        console.error('APIエラー:', errorData)
        throw new Error(errorData.error || `回答の取得に失敗しました (${response.status})`)
      }

      const data: AnswerResponse = await response.json()
      console.log('回答データ受信:', { 
        answer: data.answer, 
        answerLength: data.answer?.length, 
        sourcesCount: data.sources?.length,
        sources: data.sources 
      })
      
      // デバッグ情報を表示
      if (data.sources && data.sources.length === 0 && data.answer?.includes('関連する文書が見つかりませんでした')) {
        console.warn('⚠️ 検索結果が0件です。ターミナルのログを確認してください。')
      }
      
      setAnswer(data.answer)
      setSources(data.sources || [])
      setSourcesPage(1) // 検索結果が変わったら最初のページに戻す
      
      // 履歴を再読み込み
      loadHistory()
    } catch (err) {
      console.error('エラー発生:', err)
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleHistoryClick = (historyItem: SearchHistoryItem) => {
    setQuestion(historyItem.question)
    setAnswer(historyItem.answer)
    setSources([])
    setShowHistory(false)
    // スクロールをトップに移動
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteHistory = async (id: string) => {
    try {
      const response = await fetch('/api/search-history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        loadHistory()
      }
    } catch (err) {
      console.error('履歴削除エラー:', err)
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

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-12 animate-fadeIn">
          <div className="relative flex justify-between items-start">
            <div className="flex-1">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-wood-dark animate-grow"></div>
            <h1 className="text-5xl font-bold mb-3 text-wood-dark tracking-tight relative">
              <span className="relative z-10 bg-wood-pattern px-4 py-2 rounded-lg border-4 border-wood-dark shadow-wood-lg inline-block transform hover:scale-105 transition-transform">
                🔍 Rikkyo Insight AI
              </span>
            </h1>
            <p className="text-wood-darker text-sm font-mono mt-3 ml-4 tracking-wider">
              Query Documents → Generate Answer
            </p>
            </div>
            <button
              onClick={() => {
                setShowHistory(!showHistory)
                if (!showHistory) loadHistory()
              }}
              className="px-6 py-3 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker shadow-wood-md transition-all transform hover:scale-105 rounded-lg"
            >
              📜 履歴
            </button>
          </div>
        </div>

        {/* 検索履歴パネル */}
        {showHistory && (
          <div className="mb-8 bg-wood-light border-4 border-wood-dark rounded-lg shadow-wood-lg p-6 animate-slideDown">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-wood-darkest">検索履歴</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-wood-darker hover:text-wood-darkest font-bold"
              >
                ✕ 閉じる
              </button>
            </div>
            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="inline-block animate-pulse-gentle text-4xl mb-2">🌳</div>
                <p className="text-wood-darker">読み込み中...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-wood-darker">
                <p>検索履歴がありません</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/50 p-4 border-2 border-wood-dark rounded-lg hover:bg-white/70 transition-all cursor-pointer group"
                    onClick={() => handleHistoryClick(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-wood-darkest mb-2">{item.question}</p>
                        <p className="text-sm text-wood-darker line-clamp-2">{item.answer.substring(0, 100)}...</p>
                        <p className="text-xs text-wood-darker mt-2 font-mono">
                          {new Date(item.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteHistory(item.id)
                        }}
                        className="ml-4 px-3 py-1 bg-red-100 text-red-700 border-2 border-red-600 rounded hover:bg-red-200 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-10 animate-fadeIn">
          <div className="flex gap-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="質問を入力してください（例: 社内規程について教えてください）"
              className="flex-1 px-6 py-5 border-4 border-wood-dark bg-wood-light text-wood-darkest placeholder-wood-darker focus:outline-none focus:bg-wood-lightest focus:border-wood-darker font-medium shadow-wood-md rounded-lg text-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-10 py-5 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker disabled:bg-wood-darkest disabled:border-wood-darkest disabled:cursor-not-allowed shadow-wood-md transition-all transform hover:scale-105 disabled:transform-none rounded-lg text-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block animate-spin-slow">🔍</span>
                  検索中...
                </span>
              ) : (
                '🔍 検索'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-6 bg-red-100 border-4 border-red-700 text-red-900 shadow-wood-md rounded-lg animate-slideDown">
            <div className="font-bold mb-2 text-lg">❌ エラー</div>
            <div className="font-medium">{error}</div>
          </div>
        )}

        {answer && (
          <div className="mb-10 animate-fadeIn">
            <div className="bg-wood-dark text-wood-light px-6 py-4 border-b-4 border-wood-darker rounded-t-lg shadow-wood-md">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>💡</span>
                回答
              </h2>
            </div>
            <div className="bg-wood-light p-8 border-4 border-wood-dark border-t-0 rounded-b-lg shadow-wood-lg">
              <p className="whitespace-pre-wrap text-wood-darkest leading-relaxed text-lg">{answer}</p>
            </div>
          </div>
        )}

        {sources.length > 0 && (() => {
          const totalPages = Math.ceil(sources.length / sourcesPerPage)
          const startIndex = (sourcesPage - 1) * sourcesPerPage
          const endIndex = startIndex + sourcesPerPage
          const paginatedSources = sources.slice(startIndex, endIndex)
          
          return (
            <div className="animate-fadeIn">
              <div className="bg-wood-dark text-wood-light px-6 py-4 border-b-4 border-wood-darker rounded-t-lg shadow-wood-md mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span>📚</span>
                  参照文書 ({sources.length}件)
                </h2>
                {sources.length > sourcesPerPage && (
                  <div className="flex items-center gap-2">
                    <select
                      value={sourcesPerPage}
                      onChange={(e) => {
                        setSourcesPerPage(Number(e.target.value))
                        setSourcesPage(1)
                      }}
                      className="px-3 py-1 bg-wood-light text-wood-darkest border-2 border-wood-darker rounded-lg font-bold text-sm"
                    >
                      <option value={5}>5件/ページ</option>
                      <option value={10}>10件/ページ</option>
                      <option value={20}>20件/ページ</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {paginatedSources.map((source, index) => (
                <div
                  key={source.id}
                  className="bg-wood-light p-6 border-4 border-wood-dark shadow-wood-md rounded-lg hover:shadow-wood-lg transition-all transform hover:scale-[1.01] animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-wood-darkest text-xl mb-2 flex items-center gap-2">
                        <span className="text-2xl">📄</span>
                        {source.documentTitle || `文書 ${index + 1}`}
                      </h3>
                      {source.similarity !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-wood-darker font-mono">類似度:</span>
                            <div className="flex-1 bg-wood-darker rounded-full h-3 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-600 to-blue-600 transition-all duration-500"
                                style={{ width: `${source.similarity * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-wood-darkest font-bold font-mono min-w-[50px]">
                              {(source.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/50 p-4 rounded-lg border-2 border-wood-dark">
                    <p className="text-wood-darkest text-sm leading-relaxed">{source.content}</p>
                  </div>
                  {source.documentId && (
                    <div className="mt-3 text-right">
                      <a
                        href={`/admin/documents`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-bold underline"
                      >
                        文書を確認 →
                      </a>
                    </div>
                  )}
                </div>
              ))}
              </div>
              
              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setSourcesPage(Math.max(1, sourcesPage - 1))}
                    disabled={sourcesPage === 1}
                    className="px-4 py-2 bg-wood-dark text-wood-light border-2 border-wood-darker font-bold hover:bg-wood-darker disabled:bg-wood-darkest disabled:border-wood-darkest disabled:cursor-not-allowed shadow-wood-sm transition-all transform hover:scale-105 disabled:transform-none rounded-lg"
                  >
                    ← 前へ
                  </button>
                  <span className="px-4 py-2 bg-wood-light text-wood-darkest border-2 border-wood-dark font-bold rounded-lg">
                    {sourcesPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setSourcesPage(Math.min(totalPages, sourcesPage + 1))}
                    disabled={sourcesPage === totalPages}
                    className="px-4 py-2 bg-wood-dark text-wood-light border-2 border-wood-darker font-bold hover:bg-wood-darker disabled:bg-wood-darkest disabled:border-wood-darkest disabled:cursor-not-allowed shadow-wood-sm transition-all transform hover:scale-105 disabled:transform-none rounded-lg"
                  >
                    次へ →
                  </button>
                </div>
              )}
            </div>
          )
        })()}

        {loading && (
          <div className="text-center py-20 border-4 border-dashed border-wood-dark bg-wood-light rounded-lg shadow-wood-md animate-fadeIn">
            <div className="inline-block animate-pulse-gentle mb-4 text-6xl">🌳</div>
            <p className="text-wood-dark font-bold text-lg">検索中...</p>
            <p className="text-wood-darker text-sm font-mono mt-2">Searching Archive...</p>
          </div>
        )}

        {!answer && !loading && !error && (
          <div className="text-center py-20 border-4 border-dashed border-wood-dark bg-wood-light rounded-lg shadow-wood-md animate-fadeIn">
            <div className="text-6xl mb-4 animate-bounce-slow">💬</div>
            <p className="text-wood-dark font-bold text-xl mb-2">質問を入力して、Rikkyo School文書を検索してください</p>
            <p className="text-wood-darker text-sm font-mono">Enter your question above</p>
          </div>
        )}
      </div>
    </div>
  )
}

