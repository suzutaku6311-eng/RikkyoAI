import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: '社内文書AIシステム（RAG）',
  description: '社内PDF、規程、会議資料を横断検索し自然言語で回答できるAI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <nav className="bg-stone-100 border-b-2 border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link
                  href="/"
                  className="flex items-center px-2 py-4 text-xl font-bold text-stone-900 hover:text-stone-700 tracking-tight"
                >
                  <span className="border-b-2 border-stone-800 pb-1">社内文書AI</span>
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href="/ask"
                  className="px-4 py-2 text-sm font-medium text-stone-800 hover:text-stone-900 hover:bg-stone-200 border border-stone-800 retro-shadow-sm transition-all"
                >
                  文書検索
                </Link>
                <Link
                  href="/admin/documents"
                  className="px-4 py-2 text-sm font-medium text-stone-800 hover:text-stone-900 hover:bg-stone-200 border border-stone-800 retro-shadow-sm transition-all"
                >
                  文書一覧
                </Link>
                <Link
                  href="/admin/upload"
                  className="px-4 py-2 text-sm font-medium text-stone-800 hover:text-stone-900 hover:bg-stone-200 border border-stone-800 retro-shadow-sm transition-all"
                >
                  文書アップロード
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}

