'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

type GoogleSheetSource = {
  id: string
  spreadsheet_url: string
  sheet_name: string
  last_synced_at: string | null
  last_sheet_modified_at: string | null
  sync_enabled: boolean
  sync_interval_minutes: number
  created_at: string
  documents?: {
    id: string
    title: string
    file_name: string
    uploaded_at: string
  }
}

export default function GoogleSheetsPage() {
  const { t, language } = useLanguage()
  const [sources, setSources] = useState<GoogleSheetSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/google-sheets')
      if (!response.ok) {
        throw new Error('スプレッドシート一覧の取得に失敗しました')
      }
      const data = await response.json()
      setSources(data.sources || [])
      setError(null)
    } catch (err: any) {
      console.error('[Google Sheets] 一覧取得エラー:', err)
      setError(err.message || 'スプレッドシート一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (sourceId: string) => {
    try {
      setSyncing(sourceId)
      setMessage(null)
      const response = await fetch(`/api/admin/google-sheets/${sourceId}/sync`, {
        method: 'POST',
      })
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || '同期が完了しました' })
        fetchSources() // 一覧を再取得
      } else {
        setMessage({ type: 'error', text: data.error || '同期に失敗しました' })
      }
    } catch (err: any) {
      console.error('[Google Sheets] 同期エラー:', err)
      setMessage({ type: 'error', text: err.message || '同期に失敗しました' })
    } finally {
      setSyncing(null)
    }
  }

  const handleToggleSync = async (sourceId: string, currentEnabled: boolean) => {
    try {
      // TODO: API実装が必要
      setMessage({ type: 'success', text: '同期設定を更新しました' })
      fetchSources()
    } catch (err: any) {
      console.error('[Google Sheets] 設定更新エラー:', err)
      setMessage({ type: 'error', text: err.message || '設定の更新に失敗しました' })
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
        <div className="mb-12 pt-8 animate-fadeIn">
          <div className="relative flex justify-between items-start">
            <div className="flex-1">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-wood-dark animate-grow"></div>
              <h1 className="text-5xl font-bold mb-3 text-wood-dark tracking-tight relative">
                <span className="relative z-10 bg-wood-pattern px-4 py-2 rounded-lg border-4 border-wood-dark shadow-wood-lg inline-block transform hover:scale-105 transition-transform">
                  📊 Google Sheets連携
                </span>
              </h1>
              <p className="text-wood-darker text-sm font-mono mt-3 ml-4 tracking-wider">
                Google Spreadsheet → RAG検索
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchSources}
                disabled={loading}
                className="px-6 py-3 bg-wood-light text-wood-dark border-4 border-wood-dark font-bold hover:bg-wood-lighter disabled:bg-wood-darkest disabled:cursor-not-allowed shadow-wood-md transition-all transform hover:scale-105 hover:shadow-wood-lg disabled:transform-none rounded-lg"
              >
                <span className="inline-block">🔄</span> {language === 'ja' ? '更新' : 'Refresh'}
              </button>
              <Link
                href="/admin/google-sheets/register"
                className="px-8 py-3 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker shadow-wood-md transition-all transform hover:scale-105 hover:shadow-wood-lg rounded-lg"
              >
                + {language === 'ja' ? '新規登録' : 'Register'}
              </Link>
            </div>
          </div>
        </div>

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

        {loading && (
          <div className="text-center py-20 border-4 border-dashed border-wood-dark bg-wood-light rounded-lg shadow-wood-md animate-fadeIn">
            <div className="inline-block animate-pulse-gentle mb-4 text-6xl">🌳</div>
            <p className="text-wood-dark font-bold text-lg">{language === 'ja' ? '読み込み中...' : 'Loading...'}</p>
          </div>
        )}

        {!loading && !error && sources.length === 0 && (
          <div className="text-center py-20 border-4 border-dashed border-wood-dark bg-wood-light rounded-lg shadow-wood-md animate-fadeIn">
            <div className="text-6xl mb-4 animate-bounce-slow">📊</div>
            <p className="text-wood-dark mb-6 font-bold text-xl">{language === 'ja' ? '登録済みのスプレッドシートがありません' : 'No registered spreadsheets'}</p>
            <Link
              href="/admin/google-sheets/register"
              className="inline-block px-8 py-4 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker shadow-wood-md transition-all transform hover:scale-105 hover:shadow-wood-lg rounded-lg"
            >
              + {language === 'ja' ? 'スプレッドシートを登録' : 'Register Spreadsheet'}
            </Link>
          </div>
        )}

        {!loading && !error && sources.length > 0 && (
          <div className="bg-wood-light border-4 border-wood-dark shadow-wood-lg overflow-hidden rounded-lg animate-fadeIn">
            <div className="bg-wood-dark text-wood-light px-6 py-4 border-b-4 border-wood-darker">
              <h2 className="text-xl font-bold">📊 登録済みスプレッドシート</h2>
            </div>
            <div className="p-6 space-y-4">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="bg-white/50 p-6 border-4 border-wood-dark rounded-lg shadow-wood-md hover:shadow-wood-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-wood-darkest mb-2">
                        {source.documents?.title || `${source.sheet_name} - ${source.spreadsheet_url}`}
                      </h3>
                      <div className="text-sm text-wood-darker space-y-1">
                        <p><span className="font-bold">URL:</span> <a href={source.spreadsheet_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{source.spreadsheet_url}</a></p>
                        <p><span className="font-bold">シート名:</span> {source.sheet_name}</p>
                        <p><span className="font-bold">最終同期:</span> {source.last_synced_at ? new Date(source.last_synced_at).toLocaleString('ja-JP') : '未同期'}</p>
                        <p><span className="font-bold">同期間隔:</span> {source.sync_interval_minutes}分</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleSync(source.id)}
                        disabled={syncing === source.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105 disabled:transform-none"
                      >
                        {syncing === source.id ? (
                          <span className="flex items-center gap-2">
                            <span className="inline-block animate-pulse-gentle">🔄</span>
                            {language === 'ja' ? '同期中...' : 'Syncing...'}
                          </span>
                        ) : (
                          '🔄 同期'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

