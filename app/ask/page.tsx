'use client'

import { useState } from 'react'

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

export default function AskPage() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [error, setError] = useState<string | null>(null)

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
    } catch (err) {
      console.error('エラー発生:', err)
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-stone-50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-stone-900 tracking-tight border-b-4 border-stone-800 pb-3 inline-block">
            社内文書AI検索
          </h1>
          <p className="text-stone-600 text-sm font-mono mt-2">
            Query Documents → Generate Answer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="質問を入力してください（例: 社内規程について教えてください）"
              className="flex-1 px-5 py-4 border-2 border-stone-800 bg-stone-50 text-stone-900 placeholder-stone-500 focus:outline-none focus:bg-white focus:border-stone-900 font-medium retro-shadow-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-8 py-4 bg-stone-900 text-stone-50 border-2 border-stone-800 font-bold hover:bg-stone-800 disabled:bg-stone-400 disabled:border-stone-400 disabled:cursor-not-allowed retro-shadow-sm transition-all"
            >
              {loading ? '検索中...' : '検索'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-800 text-red-900 retro-shadow-sm">
            <div className="font-bold mb-1">エラー</div>
            <div>{error}</div>
          </div>
        )}

        {answer && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-stone-900 border-b-2 border-stone-800 pb-2 inline-block">
              回答
            </h2>
            <div className="bg-stone-100 p-8 border-2 border-stone-800 retro-shadow-sm">
              <p className="whitespace-pre-wrap text-stone-900 leading-relaxed">{answer}</p>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-stone-900 border-b-2 border-stone-800 pb-2 inline-block">
              参照文書 ({sources.length}件)
            </h2>
            <div className="space-y-4">
              {sources.map((source, index) => (
                <div
                  key={source.id}
                  className="bg-stone-100 p-6 border-2 border-stone-800 retro-shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-stone-900 text-lg border-b border-stone-800 pb-1">
                      {source.documentTitle || `文書 ${index + 1}`}
                    </h3>
                    {source.similarity && (
                      <span className="text-sm text-stone-600 font-mono bg-stone-200 px-2 py-1 border border-stone-800">
                        {(source.similarity * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed">{source.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!answer && !loading && !error && (
          <div className="text-center text-stone-500 py-16 border-2 border-dashed border-stone-400 bg-stone-100">
            <p className="text-lg font-medium">質問を入力して、社内文書を検索してください。</p>
            <p className="text-sm mt-2 font-mono text-stone-600">Enter your question above</p>
          </div>
        )}
      </div>
    </div>
  )
}

