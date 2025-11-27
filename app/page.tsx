import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-wood-pattern relative overflow-hidden">
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
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-wood-dark animate-grow"></div>
            <h1 className="text-5xl font-bold mb-4 text-wood-dark tracking-tight relative">
              <span className="relative z-10 bg-wood-pattern px-4 py-2 rounded-lg border-4 border-wood-dark shadow-wood-lg inline-block transform hover:scale-105 transition-transform">
                Rikkyo England in England Knowledge Assistant System
              </span>
            </h1>
            <p className="text-wood-darkest mb-3 text-xl mt-6 leading-relaxed font-semibold ml-4">
              立教英国学院　文書検索AIシステム
            </p>
            <p className="text-wood-darkest mb-2 text-lg mt-4 leading-relaxed ml-4">
              学校内のPDF、規程、会議資料などをまとめて検索し、
              <br />
              自然な文章でわかりやすく答えてくれる立教英国のAIアシスタントです。
            </p>
            <p className="text-wood-darker text-sm mt-4 leading-relaxed ml-4">
              最新の <span className="font-mono font-bold">RAG（Retrieval-Augmented Generation）</span> 技術を用いて、
              <br />
              必要な情報をすぐに見つけられるようサポートします。
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Link
            href="/ask"
            className="bg-wood-light p-8 border-4 border-wood-dark shadow-wood-md hover:shadow-wood-lg transition-all transform hover:scale-105 rounded-lg group animate-fadeIn"
            style={{ animationDelay: '100ms' }}
          >
            <div className="mb-4">
              <span className="text-3xl font-mono text-wood-darkest">[01]</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-wood-darkest border-b-4 border-wood-dark pb-2 inline-block">
              🔍 文書検索
            </h2>
            <p className="text-wood-darkest leading-relaxed mt-4">
              質問を入力して、立教英国学院の文書から関連情報を検索し、AIが回答を生成します。
            </p>
            <div className="mt-4 text-wood-darker text-sm font-mono font-bold">
              → 検索を開始
            </div>
          </Link>

          <Link
            href="/admin/upload"
            className="bg-wood-light p-8 border-4 border-wood-dark shadow-wood-md hover:shadow-wood-lg transition-all transform hover:scale-105 rounded-lg group animate-fadeIn"
            style={{ animationDelay: '200ms' }}
          >
            <div className="mb-4">
              <span className="text-3xl font-mono text-wood-darkest">[02]</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-wood-darkest border-b-4 border-wood-dark pb-2 inline-block">
              📤 文書アップロード
            </h2>
            <p className="text-wood-darkest leading-relaxed mt-4">
              PDFファイルをアップロードして、検索可能な形式に変換します。
            </p>
            <div className="mt-4 text-wood-darker text-sm font-mono font-bold">
              → アップロードを開始
            </div>
          </Link>
        </div>

        <div className="mt-12 bg-wood-light p-8 border-4 border-wood-dark shadow-wood-md rounded-lg animate-fadeIn">
          <div className="bg-wood-dark text-wood-light px-6 py-4 border-b-4 border-wood-darker rounded-t-lg shadow-wood-md -m-8 mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📖</span>
              使い方
            </h2>
          </div>
          <ol className="list-decimal list-inside space-y-3 text-wood-darkest leading-relaxed ml-4">
            <li>「文書アップロード」からPDFファイルをアップロード</li>
            <li>「文書検索」で質問を入力して回答を取得</li>
          </ol>
        </div>
      </div>
    </main>
  )
}

