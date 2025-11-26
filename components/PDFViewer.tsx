'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// PDF.js workerの設定
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
}

type PDFViewerProps = {
  documentId: string
  fileName: string
  onClose?: () => void
}

export default function PDFViewer({ documentId, fileName, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.5)

  const pdfUrl = `/api/admin/documents/${documentId}/view`

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error)
    setError('PDFの読み込みに失敗しました')
    setLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages || 1, prev + 1))
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(3, prev + 0.25))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] bg-wood-pattern rounded-lg shadow-wood-lg border-4 border-wood-dark overflow-hidden flex flex-col animate-slideUp">
        {/* ヘッダー */}
        <div className="bg-wood-dark text-wood-light px-6 py-4 flex items-center justify-between border-b-4 border-wood-darker">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-wood-light truncate max-w-md">
              {fileName}
            </h2>
            {numPages && (
              <span className="text-sm text-wood-light/80 font-mono">
                ページ {pageNumber} / {numPages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* ズームコントロール */}
            <div className="flex items-center gap-1 bg-wood-darker rounded px-2 py-1">
              <button
                onClick={zoomOut}
                className="px-2 py-1 text-wood-light hover:bg-wood-darkest rounded transition-colors"
                title="縮小"
              >
                −
              </button>
              <span className="text-sm text-wood-light font-mono px-2">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="px-2 py-1 text-wood-light hover:bg-wood-darkest rounded transition-colors"
                title="拡大"
              >
                +
              </button>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors"
              >
                閉じる
              </button>
            )}
          </div>
        </div>

        {/* PDF表示エリア */}
        <div className="flex-1 overflow-auto bg-wood-light p-6 flex items-start justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-wood-dark border-t-wood-light mb-4"></div>
              <p className="text-wood-dark font-medium">PDFを読み込み中...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-red-600 text-xl mb-4">⚠️</div>
              <p className="text-wood-dark font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="bg-white shadow-wood-lg rounded-lg p-6 animate-fadeIn border-2 border-wood-dark">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex flex-col items-center justify-center h-96">
                    <div className="animate-spin-slow rounded-full h-16 w-16 border-4 border-wood-dark border-t-wood-light mb-4"></div>
                    <p className="text-wood-dark font-medium">PDFを読み込み中...</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-wood-md rounded"
                />
              </Document>
            </div>
          )}
        </div>

        {/* フッター（ページナビゲーション） */}
        {numPages && numPages > 1 && (
          <div className="bg-wood-dark text-wood-light px-6 py-4 flex items-center justify-center gap-4 border-t-4 border-wood-darker">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="px-6 py-2 bg-wood-darker hover:bg-wood-darkest disabled:bg-wood-darkest disabled:opacity-50 disabled:cursor-not-allowed text-wood-light font-bold rounded transition-all transform hover:scale-105 disabled:transform-none"
            >
              ← 前へ
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= numPages) {
                    setPageNumber(page)
                  }
                }}
                className="w-20 px-3 py-2 bg-wood-darker text-wood-light text-center font-mono rounded border-2 border-wood-darkest focus:outline-none focus:border-wood-light"
              />
              <span className="text-wood-light font-mono">/ {numPages}</span>
            </div>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="px-6 py-2 bg-wood-darker hover:bg-wood-darkest disabled:bg-wood-darkest disabled:opacity-50 disabled:cursor-not-allowed text-wood-light font-bold rounded transition-all transform hover:scale-105 disabled:transform-none"
            >
              次へ →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

