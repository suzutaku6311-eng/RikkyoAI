import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'
import { checkOpenAIEnv } from '@/lib/openai'
import { splitIntoChunks, generateEmbeddingsForChunks } from '@/lib/embeddings'

// pdf-parseはNode.jsのBufferを使うため、Node.js Runtimeを指定
export const runtime = 'nodejs'

// Vercelのタイムアウト設定（最大60秒）
export const maxDuration = 60

/**
 * PDFファイルのingest処理
 * 1. PDFからテキスト抽出
 * 2. チャンク分割（300-500文字）
 * 3. Embedding生成
 * 4. Supabaseに保存
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[Ingest] 処理開始')
  
  try {
    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      console.error('[Ingest] Supabase環境変数エラー:', supabaseCheck.error)
      return NextResponse.json(
        { success: false, error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    // supabaseがnullでないことを確認（TypeScript用）
    const supabaseClient = supabase

    const openaiCheck = checkOpenAIEnv()
    if (!openaiCheck.isValid) {
      console.error('[Ingest] OpenAI環境変数エラー:', openaiCheck.error)
      return NextResponse.json(
        { success: false, error: openaiCheck.error },
        { status: 500 }
      )
    }

    // FormDataからファイルを取得
    console.log('[Ingest] FormDataを取得中...')
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file) {
      console.error('[Ingest] ファイルが指定されていません')
      return NextResponse.json(
        { success: false, error: 'ファイルが指定されていません' },
        { status: 400 }
      )
    }

    console.log(`[Ingest] ファイル情報: ${file.name}, サイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB`)

    // ファイルサイズの制限（Vercel無料プランの制限: 4.5MB）
    const maxSize = 4.5 * 1024 * 1024 // 4.5MB
    if (file.size > maxSize) {
      console.error(`[Ingest] ファイルサイズが大きすぎます: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      return NextResponse.json(
        { success: false, error: `ファイルサイズが大きすぎます。Vercel無料プランの制限により、最大4.5MBまで対応しています。現在のサイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      )
    }

    // ファイルタイプの検証（PDFのみ対応）
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      console.error('[Ingest] PDFファイルではありません')
      return NextResponse.json(
        { success: false, error: 'PDFファイルのみ対応しています' },
        { status: 400 }
      )
    }

    // PDFからテキスト抽出
    console.log('[Ingest] PDFからテキスト抽出中...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const pdfData = await pdfParse(buffer)
    const extractedText = pdfData.text
    console.log(`[Ingest] テキスト抽出完了: ${extractedText.length}文字`)

    if (!extractedText || extractedText.trim().length === 0) {
      console.error('[Ingest] PDFからテキストを抽出できませんでした')
      return NextResponse.json(
        { success: false, error: 'PDFからテキストを抽出できませんでした' },
        { status: 400 }
      )
    }

    // チャンク分割
    console.log('[Ingest] チャンク分割中...')
    const chunks = splitIntoChunks(extractedText)
    console.log(`[Ingest] チャンク分割完了: ${chunks.length}個のチャンク`)
    
    if (chunks.length === 0) {
      console.error('[Ingest] チャンク分割に失敗しました')
      return NextResponse.json(
        { success: false, error: 'チャンク分割に失敗しました' },
        { status: 500 }
      )
    }

    // Embedding生成（一括処理）
    console.log(`[Ingest] Embedding生成開始: ${chunks.length}個のチャンク`)
    const embeddingStartTime = Date.now()
    const embeddings = await generateEmbeddingsForChunks(chunks)
    const embeddingTime = Date.now() - embeddingStartTime
    console.log(`[Ingest] Embedding生成完了: ${embeddingTime}ms`)

    if (embeddings.length !== chunks.length) {
      console.error(`[Ingest] Embedding生成に失敗: ${embeddings.length}個 / ${chunks.length}個`)
      return NextResponse.json(
        { success: false, error: 'Embedding生成に失敗しました' },
        { status: 500 }
      )
    }

    // 文書情報をSupabaseに保存
    console.log('[Ingest] 文書情報をSupabaseに保存中...')
    const documentTitle = title || file.name.replace(/\.pdf$/i, '')
    const { data: documentData, error: documentError } = await supabaseClient
      .from('documents')
      .insert({
        title: documentTitle,
        file_name: file.name,
        file_type: 'pdf',
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (documentError || !documentData) {
      console.error('[Ingest] 文書保存エラー:', documentError)
      return NextResponse.json(
        { success: false, error: `文書の保存に失敗しました: ${documentError?.message || '不明なエラー'}` },
        { status: 500 }
      )
    }

    const documentId = documentData.id
    console.log(`[Ingest] 文書保存完了: ID=${documentId}`)

    // チャンクとEmbeddingをSupabaseに保存
    console.log('[Ingest] チャンクとEmbeddingをSupabaseに保存中...')
    const chunksToInsert = chunks.map((content, index) => ({
      document_id: documentId,
      content: content,
      embedding: embeddings[index],
      chunk_index: index,
      metadata: {},
    }))

    // バッチで挿入（Supabaseの制限に合わせて分割）
    const batchSize = 100
    let savedCount = 0
    for (let i = 0; i < chunksToInsert.length; i += batchSize) {
      const batch = chunksToInsert.slice(i, i + batchSize)
      const { error: chunksError } = await supabaseClient
        .from('chunks')
        .insert(batch)

      if (chunksError) {
        console.error('[Ingest] チャンク保存エラー:', chunksError)
        // エラーが発生した場合、既に保存された文書を削除
        await supabaseClient.from('documents').delete().eq('id', documentId)
        return NextResponse.json(
          { success: false, error: `チャンクの保存に失敗しました: ${chunksError.message}` },
          { status: 500 }
        )
      }
      savedCount += batch.length
      console.log(`[Ingest] チャンク保存進捗: ${savedCount}/${chunks.length}`)
    }

    const totalTime = Date.now() - startTime
    console.log(`[Ingest] 処理完了: ${totalTime}ms, チャンク数: ${chunks.length}`)

    return NextResponse.json({
      success: true,
      documentId: documentId,
      chunksCount: chunks.length,
    })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[Ingest] 処理エラー (${totalTime}ms):`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? `${error.message} (処理時間: ${totalTime}ms)` : `予期しないエラーが発生しました (処理時間: ${totalTime}ms)`,
      },
      { status: 500 }
    )
  }
}

