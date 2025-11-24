import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">社内文書AIシステム（RAG）</h1>
        <p className="text-gray-600 mb-8 text-lg">
          社内PDF、規程、会議資料を横断検索し自然言語で回答できるAIシステムです。
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Link
            href="/ask"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <h2 className="text-2xl font-semibold mb-2 text-blue-600">
              📚 文書検索
            </h2>
            <p className="text-gray-600">
              質問を入力して、社内文書から関連情報を検索し、AIが回答を生成します。
            </p>
          </Link>

          <Link
            href="/admin/upload"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <h2 className="text-2xl font-semibold mb-2 text-green-600">
              📤 文書アップロード
            </h2>
            <p className="text-gray-600">
              PDFファイルをアップロードして、検索可能な形式に変換します。
            </p>
          </Link>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="font-semibold mb-2">使い方</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>「文書アップロード」からPDFファイルをアップロード</li>
            <li>「文書検索」で質問を入力して回答を取得</li>
          </ol>
        </div>
      </div>
    </main>
  )
}

