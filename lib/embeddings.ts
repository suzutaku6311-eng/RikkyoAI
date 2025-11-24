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
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: chunks,
    })
    
    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('一括Embedding生成エラー:', error)
    throw new Error('Embedding生成に失敗しました')
  }
}

