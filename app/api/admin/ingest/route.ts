import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'
import { checkOpenAIEnv } from '@/lib/openai'
import { splitIntoChunks, generateEmbeddingsForChunks } from '@/lib/embeddings'

// pdf-parseはNode.jsのBufferを使うため、Node.js Runtimeを指定
export const runtime = 'nodejs'

/**
 * PDFファイルのingest処理
 * 1. PDFからテキスト抽出
 * 2. チャンク分割（300-500文字）
 * 3. Embedding生成
 * 4. Supabaseに保存
 */
export async function POST(request: NextRequest) {
  try {
    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      return NextResponse.json(
        { success: false, error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    const openaiCheck = checkOpenAIEnv()
    if (!openaiCheck.isValid) {
      return NextResponse.json(
        { success: false, error: openaiCheck.error },
        { status: 500 }
      )
    }

    // FormDataからファイルを取得
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが指定されていません' },
        { status: 400 }
      )
    }

    // ファイルタイプの検証（PDFのみ対応）
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'PDFファイルのみ対応しています' },
        { status: 400 }
      )
    }

    // PDFからテキスト抽出
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const pdfData = await pdfParse(buffer)
    const extractedText = pdfData.text

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'PDFからテキストを抽出できませんでした' },
        { status: 400 }
      )
    }

    // チャンク分割
    const chunks = splitIntoChunks(extractedText)
    
    if (chunks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'チャンク分割に失敗しました' },
        { status: 500 }
      )
    }

    // Embedding生成（一括処理）
    const embeddings = await generateEmbeddingsForChunks(chunks)

    if (embeddings.length !== chunks.length) {
      return NextResponse.json(
        { success: false, error: 'Embedding生成に失敗しました' },
        { status: 500 }
      )
    }

    // 文書情報をSupabaseに保存
    const documentTitle = title || file.name.replace(/\.pdf$/i, '')
    const { data: documentData, error: documentError } = await supabase
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
      console.error('文書保存エラー:', documentError)
      return NextResponse.json(
        { success: false, error: '文書の保存に失敗しました' },
        { status: 500 }
      )
    }

    const documentId = documentData.id

    // チャンクとEmbeddingをSupabaseに保存
    const chunksToInsert = chunks.map((content, index) => ({
      document_id: documentId,
      content: content,
      embedding: embeddings[index],
      chunk_index: index,
      metadata: {},
    }))

    // バッチで挿入（Supabaseの制限に合わせて分割）
    const batchSize = 100
    for (let i = 0; i < chunksToInsert.length; i += batchSize) {
      const batch = chunksToInsert.slice(i, i + batchSize)
      const { error: chunksError } = await supabase
        .from('chunks')
        .insert(batch)

      if (chunksError) {
        console.error('チャンク保存エラー:', chunksError)
        // エラーが発生した場合、既に保存された文書を削除
        await supabase.from('documents').delete().eq('id', documentId)
        return NextResponse.json(
          { success: false, error: 'チャンクの保存に失敗しました' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      documentId: documentId,
      chunksCount: chunks.length,
    })
  } catch (error) {
    console.error('Ingest処理エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    )
  }
}

