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
        <nav className="bg-wood-dark border-b-4 border-wood-darker shadow-wood-md relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link
                  href="/"
                  className="flex items-center px-4 py-2 text-xl font-bold text-wood-light hover:text-wood-lightest tracking-tight transition-colors"
                >
                  <span className="text-2xl mr-2">🌳</span>
                  <span className="border-b-2 border-wood-light pb-1">社内文書AI</span>
                </Link>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href="/ask"
                  className="px-4 py-2 text-sm font-bold text-wood-light hover:text-wood-lightest hover:bg-wood-darker border-2 border-wood-darker shadow-wood-sm transition-all transform hover:scale-105 rounded-lg"
                >
                  🔍 文書検索
                </Link>
                <Link
                  href="/admin/documents"
                  className="px-4 py-2 text-sm font-bold text-wood-light hover:text-wood-lightest hover:bg-wood-darker border-2 border-wood-darker shadow-wood-sm transition-all transform hover:scale-105 rounded-lg"
                >
                  📚 文書一覧
                </Link>
                <Link
                  href="/admin/upload"
                  className="px-4 py-2 text-sm font-bold text-wood-light hover:text-wood-lightest hover:bg-wood-darker border-2 border-wood-darker shadow-wood-sm transition-all transform hover:scale-105 rounded-lg"
                >
                  📤 文書アップロード
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

