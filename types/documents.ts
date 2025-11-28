// 文書関連の型定義

export type DocumentMetadata = {
  title: string
  fileName: string
  fileType: 'pdf' | 'docx' | 'txt'
  uploadedAt: string
}

export type DocumentChunk = {
  id?: string
  documentId: string
  content: string
  embedding: number[]
  chunkIndex: number
  metadata?: Record<string, unknown>
}

export type IngestRequest = {
  file: File
  title?: string
}

export type IngestResponse = {
  success: boolean
  documentId?: string
  chunksCount?: number
  error?: string
}













