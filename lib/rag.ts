import { supabase } from './supabase'
import { generateEmbedding } from './embeddings'
import { openai } from './openai'

export type ChunkSummary = {
  id: string
  content: string
  documentId: string
  documentTitle?: string
  chunkIndex: number
  similarity?: number
}

/**
 * RAG検索処理
 * 1. 質問をEmbedding化
 * 2. ベクトル検索で類似チャンクを取得
 * 3. 関連文書情報を取得
 */
export async function searchSimilarChunks(
  question: string,
  limit = 10
): Promise<ChunkSummary[]> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }
  
  try {
    console.log(`質問のEmbedding生成を開始: "${question}"`)
    // 質問をEmbedding化
    const questionEmbedding = await generateEmbedding(question)
    console.log(`Embedding生成完了。次元数: ${questionEmbedding.length}`)

    // ベクトル検索（コサイン類似度）
    console.log('[RAG] RPC関数を呼び出し中...')
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: questionEmbedding,
      match_threshold: 0.7,
      match_count: limit,
    })

    if (error) {
      console.error('[RAG] RPC関数エラー:', error)
      console.log('[RAG] RPC関数が存在しないかエラーが発生したため、クライアント側でベクトル検索を実行します')
      // RPC関数が存在しない場合は、すべてのチャンクを取得してから類似度計算
      // pgvector型は配列として返されるが、明示的にキャストする
      const { data: chunksData, error: chunksError } = await supabase
        .from('chunks')
        .select('id, content, document_id, chunk_index, embedding')
        // embeddingを明示的に取得（pgvector型は自動的に配列として返される）

      if (chunksError) {
        console.error('チャンク取得エラー:', chunksError)
        throw new Error(`ベクトル検索エラー: ${chunksError.message}`)
      }

      if (!chunksData || chunksData.length === 0) {
        console.log('チャンクが見つかりませんでした')
        return []
      }

      console.log(`取得したチャンク数: ${chunksData.length}`)

      // 最初のチャンクのEmbedding形式を確認
      if (chunksData.length > 0) {
        const firstChunk = chunksData[0]
        console.log(`最初のチャンクのEmbedding形式:`, {
          hasEmbedding: !!firstChunk.embedding,
          embeddingType: typeof firstChunk.embedding,
          isArray: Array.isArray(firstChunk.embedding),
          embeddingLength: firstChunk.embedding ? (Array.isArray(firstChunk.embedding) ? firstChunk.embedding.length : 'N/A') : 'N/A',
          embeddingSample: firstChunk.embedding ? (Array.isArray(firstChunk.embedding) ? firstChunk.embedding.slice(0, 3) : String(firstChunk.embedding).substring(0, 100)) : 'N/A',
        })
      }

      // クライアント側で類似度計算
      let validChunksCount = 0
      let invalidChunksCount = 0
      let noEmbeddingCount = 0
      let wrongDimensionCount = 0
      
      const chunksWithSimilarity = chunksData
        .map((chunk) => {
          // Embeddingが存在しない場合
          if (!chunk.embedding) {
            noEmbeddingCount++
            return null
          }

          // Embeddingを配列に変換（pgvectorは文字列として返される可能性がある）
          let embeddingArray: number[] = []
          
          if (Array.isArray(chunk.embedding)) {
            embeddingArray = chunk.embedding
          } else if (typeof chunk.embedding === 'string') {
            // 文字列の場合はJSONとしてパースを試みる
            try {
              embeddingArray = JSON.parse(chunk.embedding)
            } catch (e) {
              console.warn(`チャンク ${chunk.id} のEmbeddingをパースできませんでした`)
              invalidChunksCount++
              return null
            }
          } else {
            console.warn(`チャンク ${chunk.id} のEmbeddingが予期しない形式です: ${typeof chunk.embedding}`)
            invalidChunksCount++
            return null
          }

          // 配列でない場合
          if (!Array.isArray(embeddingArray)) {
            invalidChunksCount++
            return null
          }

          // 次元数のチェック
          if (embeddingArray.length !== questionEmbedding.length) {
            wrongDimensionCount++
            if (invalidChunksCount < 5) { // 最初の5件だけログ出力
              console.warn(`チャンク ${chunk.id} のEmbedding次元数が一致しません: ${embeddingArray.length} vs ${questionEmbedding.length}`)
            }
            return null
          }

          validChunksCount++
          const similarity = cosineSimilarity(questionEmbedding, embeddingArray)
          return { ...chunk, similarity, embedding: embeddingArray }
        })
        .filter((chunk): chunk is NonNullable<typeof chunk> => chunk !== null)
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, limit)
      
      console.log(`有効なチャンク: ${validChunksCount}, 無効なチャンク: ${invalidChunksCount}`)
      console.log(`  - Embeddingなし: ${noEmbeddingCount}`)
      console.log(`  - 次元数不一致: ${wrongDimensionCount}`)

      console.log(`類似度計算後のチャンク数: ${chunksWithSimilarity.length}`)
      if (chunksWithSimilarity.length > 0) {
        console.log(`最高類似度: ${chunksWithSimilarity[0].similarity?.toFixed(4)}`)
        console.log(`最低類似度: ${chunksWithSimilarity[chunksWithSimilarity.length - 1].similarity?.toFixed(4)}`)
      }

      // 文書情報を取得
      const documentIds = [
        ...new Set(chunksWithSimilarity.map((c) => c.document_id)),
      ]
      const { data: documents } = await supabase
        .from('documents')
        .select('id, title')
        .in('id', documentIds)

      const documentMap = new Map(
        documents?.map((doc) => [doc.id, doc.title]) || []
      )

      const result = chunksWithSimilarity.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        documentId: chunk.document_id,
        documentTitle: documentMap.get(chunk.document_id),
        chunkIndex: chunk.chunk_index,
        similarity: chunk.similarity,
      }))
      
      console.log(`[RAG] フォールバック処理の結果を返します: ${result.length}件`)
      return result
    }

    // RPC関数が存在する場合
    console.log(`[RAG] RPC関数から ${chunks?.length || 0}件のチャンクを取得`)
    
    if (!chunks || chunks.length === 0) {
      console.log('[RAG] RPC関数からチャンクが返されませんでした（閾値が高すぎる可能性があります）')
      // フォールバック処理に移行
      console.log('[RAG] フォールバック処理に移行します')
      
      // フォールバック処理: すべてのチャンクを取得してから類似度計算
      const { data: chunksData, error: chunksError } = await supabase
        .from('chunks')
        .select('id, content, document_id, chunk_index, embedding')

      if (chunksError) {
        console.error('[RAG] フォールバック: チャンク取得エラー:', chunksError)
        throw new Error(`ベクトル検索エラー: ${chunksError.message}`)
      }

      if (!chunksData || chunksData.length === 0) {
        console.log('[RAG] フォールバック: チャンクが見つかりませんでした')
        return []
      }

      console.log(`[RAG] フォールバック: 取得したチャンク数: ${chunksData.length}`)

      // クライアント側で類似度計算
      let validChunksCount = 0
      let invalidChunksCount = 0
      let noEmbeddingCount = 0
      let wrongDimensionCount = 0
      
      const chunksWithSimilarity = chunksData
        .map((chunk) => {
          if (!chunk.embedding) {
            noEmbeddingCount++
            return null
          }

          let embeddingArray: number[] = []
          
          if (Array.isArray(chunk.embedding)) {
            embeddingArray = chunk.embedding
          } else if (typeof chunk.embedding === 'string') {
            try {
              embeddingArray = JSON.parse(chunk.embedding)
            } catch (e) {
              invalidChunksCount++
              return null
            }
          } else {
            invalidChunksCount++
            return null
          }

          if (!Array.isArray(embeddingArray) || embeddingArray.length !== questionEmbedding.length) {
            wrongDimensionCount++
            return null
          }

          validChunksCount++
          const similarity = cosineSimilarity(questionEmbedding, embeddingArray)
          return { ...chunk, similarity, embedding: embeddingArray }
        })
        .filter((chunk): chunk is NonNullable<typeof chunk> => chunk !== null)
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, limit)
      
      console.log(`[RAG] フォールバック: 有効なチャンク: ${validChunksCount}, 無効なチャンク: ${invalidChunksCount}`)
      console.log(`[RAG] フォールバック: 類似度計算後のチャンク数: ${chunksWithSimilarity.length}`)
      
      if (chunksWithSimilarity.length > 0) {
        console.log(`[RAG] フォールバック: 最高類似度: ${chunksWithSimilarity[0].similarity?.toFixed(4)}`)
      }

      // 文書情報を取得
      const documentIds = [
        ...new Set(chunksWithSimilarity.map((c) => c.document_id)),
      ]
      const { data: documents } = await supabase
        .from('documents')
        .select('id, title')
        .in('id', documentIds)

      const documentMap = new Map(
        documents?.map((doc) => [doc.id, doc.title]) || []
      )

      const result = chunksWithSimilarity.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        documentId: chunk.document_id,
        documentTitle: documentMap.get(chunk.document_id),
        chunkIndex: chunk.chunk_index,
        similarity: chunk.similarity,
      }))
      
      console.log(`[RAG] フォールバック処理の結果を返します: ${result.length}件`)
      return result
    }

    const documentIds = [...new Set(chunks.map((c: any) => c.document_id))]
    console.log(`[RAG] 関連文書ID: ${documentIds.length}件`)
    
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title')
      .in('id', documentIds)

    const documentMap = new Map(
      documents?.map((doc) => [doc.id, doc.title]) || []
    )

    const result = chunks.map((chunk: any) => ({
      id: chunk.id,
      content: chunk.content,
      documentId: chunk.document_id,
      documentTitle: documentMap.get(chunk.document_id),
      chunkIndex: chunk.chunk_index,
      similarity: chunk.similarity,
    }))
    
    console.log(`[RAG] 検索結果を返します: ${result.length}件`)
    return result
  } catch (error) {
    console.error('RAG検索エラー:', error)
    throw error
  }
}

/**
 * コサイン類似度を計算
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * RAGプロンプトを構築してLLMに送信
 */
export async function generateAnswer(
  question: string,
  chunks: ChunkSummary[]
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI client is not initialized. Please check OPENAI_API_KEY environment variable.')
  }
  
  try {
    // コンテキストを構築
    const context = chunks
      .map(
        (chunk, index) =>
          `[文書${index + 1}${chunk.documentTitle ? `: ${chunk.documentTitle}` : ''}]\n${chunk.content}`
      )
      .join('\n\n')

    const systemPrompt = `あなたは社内文書を参照して質問に答えるAIアシスタントです。
以下の文書から情報を抽出して、質問に正確に答えてください。
文書に記載されていない内容については、「文書に記載されていないため、回答できません」と答えてください。
回答は簡潔で分かりやすく、必要に応じて文書の内容を引用してください。`

    const userPrompt = `以下の文書を参照して、質問に答えてください。

【参照文書】
${context}

【質問】
${question}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return response.choices[0]?.message?.content || '回答を生成できませんでした'
  } catch (error) {
    console.error('LLM回答生成エラー:', error)
    throw new Error('回答の生成に失敗しました')
  }
}

