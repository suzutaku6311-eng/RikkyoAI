import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-stone-50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-4 text-stone-900 tracking-tight border-b-4 border-stone-800 pb-4 inline-block">
            Rikkyo School in England<br />Insight AI System
          </h1>
          <p className="text-stone-700 mb-2 text-lg mt-6 leading-relaxed">
            Search and query Rikkyo School documents with AI-powered natural language responses.
          </p>
          <p className="text-stone-600 text-sm font-mono">
            RAG (Retrieval-Augmented Generation) System
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Link
            href="/ask"
            className="bg-stone-100 p-8 border-2 border-stone-800 retro-shadow hover:retro-shadow-sm transition-all group"
          >
            <div className="mb-4">
              <span className="text-3xl font-mono text-stone-800">[01]</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-stone-900 border-b-2 border-stone-800 pb-2 inline-block">
              文書検索
            </h2>
            <p className="text-stone-700 leading-relaxed mt-4">
              質問を入力して、社内文書から関連情報を検索し、AIが回答を生成します。
            </p>
            <div className="mt-4 text-stone-600 text-sm font-mono">
              → 検索を開始
            </div>
          </Link>

          <Link
            href="/admin/upload"
            className="bg-stone-100 p-8 border-2 border-stone-800 retro-shadow hover:retro-shadow-sm transition-all group"
          >
            <div className="mb-4">
              <span className="text-3xl font-mono text-stone-800">[02]</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-stone-900 border-b-2 border-stone-800 pb-2 inline-block">
              文書アップロード
            </h2>
            <p className="text-stone-700 leading-relaxed mt-4">
              PDFファイルをアップロードして、検索可能な形式に変換します。
            </p>
            <div className="mt-4 text-stone-600 text-sm font-mono">
              → アップロードを開始
            </div>
          </Link>
        </div>

        <div className="mt-12 bg-stone-200 p-8 border-2 border-stone-800 retro-shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-stone-900 border-b-2 border-stone-800 pb-2 inline-block">
            使い方
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-stone-800 leading-relaxed">
            <li>「文書アップロード」からPDFファイルをアップロード</li>
            <li>「文書検索」で質問を入力して回答を取得</li>
          </ol>
        </div>
      </div>
    </main>
  )
}

