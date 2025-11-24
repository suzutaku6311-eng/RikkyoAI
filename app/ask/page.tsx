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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">社内文書AI検索</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="質問を入力してください（例: 社内規程について教えてください）"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '検索中...' : '質問する'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {answer && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">回答</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="whitespace-pre-wrap text-gray-800">{answer}</p>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              参照文書 ({sources.length}件)
            </h2>
            <div className="space-y-4">
              {sources.map((source, index) => (
                <div
                  key={source.id}
                  className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {source.documentTitle || `文書 ${index + 1}`}
                    </h3>
                    {source.similarity && (
                      <span className="text-sm text-gray-500">
                        類似度: {(source.similarity * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{source.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!answer && !loading && !error && (
          <div className="text-center text-gray-500 py-12">
            <p>質問を入力して、社内文書を検索してください。</p>
          </div>
        )}
      </div>
    </div>
  )
}

