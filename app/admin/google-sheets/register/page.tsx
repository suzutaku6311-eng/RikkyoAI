'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

export default function RegisterGoogleSheetPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [title, setTitle] = useState('')
  const [syncInterval, setSyncInterval] = useState(60)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [checkingSheets, setCheckingSheets] = useState(false)

  const handleCheckSheets = async () => {
    if (!spreadsheetUrl.trim()) {
      setMessage({ type: 'error', text: language === 'ja' ? 'スプレッドシートURLを入力してください' : 'Please enter spreadsheet URL' })
      return
    }

    try {
      setCheckingSheets(true)
      setMessage(null)
      
      // Spreadsheet IDを抽出
      const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (!match) {
        setMessage({ type: 'error', text: language === 'ja' ? '無効なスプレッドシートURLです' : 'Invalid spreadsheet URL' })
        return
      }

      const spreadsheetId = match[1]
      
      // シート一覧を取得するAPIを呼び出す（後で実装）
      // 今は仮実装として、ユーザーに手動でシート名を入力してもらう
      setMessage({ type: 'success', text: language === 'ja' ? 'URLが有効です。シート名を入力してください。' : 'URL is valid. Please enter sheet name.' })
    } catch (err: any) {
      console.error('[Register] シート確認エラー:', err)
      setMessage({ type: 'error', text: err.message || (language === 'ja' ? 'シートの確認に失敗しました' : 'Failed to check sheets') })
    } finally {
      setCheckingSheets(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!spreadsheetUrl.trim() || !sheetName.trim()) {
      setMessage({ type: 'error', text: language === 'ja' ? 'スプレッドシートURLとシート名は必須です' : 'Spreadsheet URL and sheet name are required' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/google-sheets/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheet_url: spreadsheetUrl.trim(),
          sheet_name: sheetName.trim(),
          title: title.trim() || undefined,
          sync_interval_minutes: syncInterval,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || (language === 'ja' ? 'スプレッドシートの登録が完了しました' : 'Spreadsheet registered successfully') })
        setTimeout(() => {
          router.push('/admin/google-sheets')
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || (language === 'ja' ? '登録に失敗しました' : 'Registration failed') })
      }
    } catch (err: any) {
      console.error('[Register] 登録エラー:', err)
      setMessage({ type: 'error', text: err.message || (language === 'ja' ? '登録に失敗しました' : 'Registration failed') })
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
                📊 Google Sheets登録
              </span>
            </h1>
            <p className="text-wood-darker text-sm font-mono mt-3 ml-4 tracking-wider">
              Register Spreadsheet → Sync → RAG Search
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-wood-light p-8 border-4 border-wood-dark shadow-wood-md rounded-lg animate-fadeIn">
          {message && (
            <div
              className={`mb-6 p-6 border-4 shadow-wood-md rounded-lg animate-slideDown ${
                message.type === 'success'
                  ? 'bg-green-100 border-green-700 text-green-900'
                  : 'bg-red-100 border-red-700 text-red-900'
              }`}
            >
              <div className="font-bold mb-2 text-lg flex items-center gap-2">
                {message.type === 'success' ? '✅ 成功' : '❌ エラー'}
              </div>
              <div className="font-medium">{message.text}</div>
            </div>
          )}

          <div className="mb-6">
            <label
              htmlFor="spreadsheet-url"
              className="block text-sm font-bold text-wood-darkest mb-3 border-b-4 border-wood-dark pb-2"
            >
              📊 スプレッドシートURL（必須）
            </label>
            <div className="flex gap-2">
              <input
                id="spreadsheet-url"
                type="text"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit"
                className="flex-1 px-6 py-4 border-4 border-wood-dark bg-white text-wood-darkest placeholder-wood-darker focus:outline-none focus:bg-wood-lightest focus:border-wood-darker font-medium shadow-wood-md rounded-lg"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={handleCheckSheets}
                disabled={checkingSheets || !spreadsheetUrl.trim()}
                className="px-6 py-4 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker disabled:bg-wood-darkest disabled:cursor-not-allowed shadow-wood-md transition-all transform hover:scale-105 disabled:transform-none rounded-lg"
              >
                {checkingSheets ? '確認中...' : '確認'}
              </button>
            </div>
            <p className="mt-2 text-sm text-wood-darker">
              {language === 'ja' 
                ? 'スプレッドシートを開き、URLバーからURLをコピーしてください' 
                : 'Open the spreadsheet and copy the URL from the address bar'}
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="sheet-name"
              className="block text-sm font-bold text-wood-darkest mb-3 border-b-4 border-wood-dark pb-2"
            >
              📄 シート名（必須）
            </label>
            <input
              id="sheet-name"
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="議事録"
              className="w-full px-6 py-4 border-4 border-wood-dark bg-white text-wood-darkest placeholder-wood-darker focus:outline-none focus:bg-wood-lightest focus:border-wood-darker font-medium shadow-wood-md rounded-lg"
              disabled={loading}
              required
            />
            <p className="mt-2 text-sm text-wood-darker">
              {language === 'ja' 
                ? 'スプレッドシート内のシート名を入力してください（例: "議事録", "Sheet1"）' 
                : 'Enter the sheet name within the spreadsheet (e.g., "Minutes", "Sheet1")'}
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-bold text-wood-darkest mb-3 border-b-4 border-wood-dark pb-2"
            >
              📝 タイトル（オプション）
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ja' ? 'スプレッドシートのタイトルから自動設定されます' : 'Auto-set from spreadsheet title'}
              className="w-full px-6 py-4 border-4 border-wood-dark bg-white text-wood-darkest placeholder-wood-darker focus:outline-none focus:bg-wood-lightest focus:border-wood-darker font-medium shadow-wood-md rounded-lg"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="sync-interval"
              className="block text-sm font-bold text-wood-darkest mb-3 border-b-4 border-wood-dark pb-2"
            >
              ⏰ 同期間隔（分）
            </label>
            <select
              id="sync-interval"
              value={syncInterval}
              onChange={(e) => setSyncInterval(Number(e.target.value))}
              className="w-full px-6 py-4 border-4 border-wood-dark bg-white text-wood-darkest focus:outline-none focus:bg-wood-lightest focus:border-wood-darker font-medium shadow-wood-md rounded-lg"
              disabled={loading}
            >
              <option value={15}>15分</option>
              <option value={30}>30分</option>
              <option value={60}>60分（推奨）</option>
              <option value={120}>120分</option>
              <option value={240}>240分</option>
            </select>
            <p className="mt-2 text-sm text-wood-darker">
              {language === 'ja' 
                ? 'スプレッドシートを自動同期する間隔を設定します' 
                : 'Set the interval for automatic synchronization'}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !spreadsheetUrl.trim() || !sheetName.trim()}
              className="flex-1 px-8 py-5 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker disabled:bg-wood-darkest disabled:border-wood-darkest disabled:cursor-not-allowed shadow-wood-md transition-all transform hover:scale-105 disabled:transform-none rounded-lg text-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="inline-block animate-pulse-gentle">📊</span>
                  {language === 'ja' ? '登録中...' : 'Registering...'}
                </span>
              ) : (
                '📊 登録'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/google-sheets')}
              className="px-8 py-5 bg-wood-light text-wood-darkest border-4 border-wood-dark font-bold hover:bg-wood-lightest shadow-wood-md transition-all transform hover:scale-105 rounded-lg text-lg"
            >
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

