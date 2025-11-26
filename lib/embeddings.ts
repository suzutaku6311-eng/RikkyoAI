import { openai } from './openai'
import type { DocumentChunk } from '@/types/documents'

/**
 * テキストを300-500文字のチャンクに分割する
 * 文の途中で切れないように、可能な限り文の境界で分割する
 */
export function splitIntoChunks(text: string, minChunkSize = 300, maxChunkSize = 500): string[] {
  const chunks: string[] = []
  
  // 改行や句点で分割してから結合
  const sentences = text.split(/([。．\n]+)/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    if (!trimmedSentence) continue
    
    // 現在のチャンクに追加した場合の長さ
    const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence
    
    if (potentialChunk.length <= maxChunkSize) {
      // 最大サイズ以下なら追加
      currentChunk = potentialChunk
    } else {
      // 最大サイズを超える場合
      if (currentChunk.length >= minChunkSize) {
        // 最小サイズ以上なら現在のチャンクを保存
        chunks.push(currentChunk)
        currentChunk = trimmedSentence
      } else {
        // 最小サイズ未満なら強制的に追加（長い文の場合は仕方ない）
        currentChunk = potentialChunk
      }
    }
    
    // 現在のチャンクが最大サイズを超えた場合、強制的に分割
    if (currentChunk.length > maxChunkSize) {
      // 最大サイズで分割
      while (currentChunk.length > maxChunkSize) {
        const splitPoint = currentChunk.lastIndexOf(' ', maxChunkSize)
        const splitIndex = splitPoint > 0 ? splitPoint : maxChunkSize
        chunks.push(currentChunk.substring(0, splitIndex).trim())
        currentChunk = currentChunk.substring(splitIndex).trim()
      }
    }
  }
  
  // 残りのチャンクを追加
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks.filter(chunk => chunk.length > 0)
}

/**
 * テキストからEmbeddingを生成する
 * OpenAI text-embedding-3-large を使用
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI client is not initialized. Please check OPENAI_API_KEY environment variable.')
  }
  
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Embedding生成エラー:', error)
    throw new Error('Embedding生成に失敗しました')
  }
}

/**
 * 複数のチャンクから一括でEmbeddingを生成する
 */
export async function generateEmbeddingsForChunks(chunks: string[]): Promise<number[][]> {
  if (!openai) {
    throw new Error('OpenAI client is not initialized. Please check OPENAI_API_KEY environment variable.')
  }
  
  // チャンク数が多い場合はバッチ処理に分割（OpenAI APIの制限を考慮）
  const batchSize = 100 // 一度に処理する最大チャンク数
  const allEmbeddings: number[][] = []
  
  try {
    console.log(`[Embeddings] OpenAI API呼び出し開始: ${chunks.length}個のチャンク（バッチサイズ: ${batchSize}）`)
    
    // バッチごとに処理
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(chunks.length / batchSize)
      
      console.log(`[Embeddings] バッチ ${batchNumber}/${totalBatches} 処理中: ${batch.length}個のチャンク`)
      
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-large',
          input: batch,
        })
        
        console.log(`[Embeddings] バッチ ${batchNumber}/${totalBatches} 成功: ${response.data.length}個のEmbeddingを取得`)
        
        if (response.data.length !== batch.length) {
          console.error(`[Embeddings] バッチ ${batchNumber} のEmbedding数が一致しません: ${response.data.length}個 / ${batch.length}個`)
          throw new Error(`バッチ ${batchNumber} のEmbedding数が一致しません: ${response.data.length}個 / ${batch.length}個`)
        }
        
        const batchEmbeddings = response.data.map(item => item.embedding)
        allEmbeddings.push(...batchEmbeddings)
        
        // レート制限を避けるために少し待機（最後のバッチ以外）
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100)) // 100ms待機
        }
      } catch (batchError: any) {
        console.error(`[Embeddings] バッチ ${batchNumber}/${totalBatches} エラー:`, batchError)
        
        // エラーの詳細をログに記録
        if (batchError?.response) {
          console.error(`[Embeddings] バッチ ${batchNumber} OpenAI APIレスポンスエラー:`, batchError.response.status, JSON.stringify(batchError.response.data))
        }
        if (batchError?.message) {
          console.error(`[Embeddings] バッチ ${batchNumber} エラーメッセージ:`, batchError.message)
        }
        
        // 401エラー（APIキー無効）の場合の特別な処理
        if (batchError?.status === 401 || batchError?.code === 'invalid_api_key') {
          throw new Error('OpenAI APIキーが無効です。Vercelの環境変数でOPENAI_API_KEYを確認してください。')
        }
        
        // 429エラー（レート制限）の場合の特別な処理
        if (batchError?.status === 429) {
          throw new Error('OpenAI APIのレート制限に達しました。しばらく待ってから再度お試しください。')
        }
        
        // より詳細なエラーメッセージを返す
        const errorMessage = batchError?.message || 'Embedding生成に失敗しました'
        const statusCode = batchError?.status || batchError?.response?.status || 'unknown'
        const statusText = batchError?.response?.statusText || ''
        const errorData = batchError?.response?.data ? JSON.stringify(batchError.response.data) : ''
        
        throw new Error(`バッチ ${batchNumber} のEmbedding生成に失敗しました: ${errorMessage} (Status: ${statusCode} ${statusText}) ${errorData}`)
      }
    }
    
    console.log(`[Embeddings] すべてのバッチ処理完了: 合計 ${allEmbeddings.length}個のEmbeddingを取得`)
    
    if (allEmbeddings.length !== chunks.length) {
      console.error(`[Embeddings] 最終的なEmbedding数が一致しません: ${allEmbeddings.length}個 / ${chunks.length}個`)
      throw new Error(`最終的なEmbedding数が一致しません: ${allEmbeddings.length}個 / ${chunks.length}個`)
    }
    
    return allEmbeddings
  } catch (error: any) {
    console.error('[Embeddings] 一括Embedding生成エラー:', error)
    
    // エラーの詳細をログに記録
    if (error?.response) {
      console.error('[Embeddings] OpenAI APIレスポンスエラー:', error.response.status, JSON.stringify(error.response.data))
    }
    if (error?.message) {
      console.error('[Embeddings] エラーメッセージ:', error.message)
    }
    
    // エラーをそのまま再スロー（既に詳細なメッセージが含まれている）
    throw error
  }
}

