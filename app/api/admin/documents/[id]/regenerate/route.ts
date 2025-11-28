import { NextRequest, NextResponse } from 'next/server'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'
import { checkOpenAIEnv } from '@/lib/openai'
import { splitIntoChunks, generateEmbeddingsForChunks } from '@/lib/embeddings'
import { requireAdmin } from '@/lib/auth-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Embedding再生成API
 * 指定された文書のチャンクを再生成し、Embeddingを更新する
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  console.log(`[Regenerate] 処理開始: documentId=${params.id}`)
  
  try {
    // 認証チェック（管理者のみ）
    const { error: authError } = await requireAdmin(request)
    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: authError.status }
      )
    }

    const documentId = params.id

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      return NextResponse.json(
        { success: false, error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    const supabaseClient = supabase

    const openaiCheck = checkOpenAIEnv()
    if (!openaiCheck.isValid) {
      return NextResponse.json(
        { success: false, error: openaiCheck.error },
        { status: 500 }
      )
    }

    // 文書情報を取得
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('id, title, file_name, file_type')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      console.error('[Regenerate] 文書取得エラー:', docError)
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    console.log(`[Regenerate] 文書情報: ${document.title}`)

    // 既存のチャンクを取得（テキストのみ）
    const { data: existingChunks, error: chunksError } = await supabaseClient
      .from('chunks')
      .select('id, content')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })

    if (chunksError) {
      console.error('[Regenerate] チャンク取得エラー:', chunksError)
      return NextResponse.json(
        { success: false, error: `チャンクの取得に失敗しました: ${chunksError.message}` },
        { status: 500 }
      )
    }

    if (!existingChunks || existingChunks.length === 0) {
      return NextResponse.json(
        { success: false, error: '再生成するチャンクが見つかりませんでした' },
        { status: 404 }
      )
    }

    console.log(`[Regenerate] ${existingChunks.length}個のチャンクを再生成します`)

    // Embeddingを再生成
    const chunks = existingChunks.map(c => c.content)
    console.log('[Regenerate] Embedding生成開始...')
    
    let embeddings: number[][]
    try {
      embeddings = await generateEmbeddingsForChunks(chunks)
      console.log(`[Regenerate] Embedding生成完了: ${embeddings.length}個`)
    } catch (error: any) {
      console.error('[Regenerate] Embedding生成エラー:', error)
      return NextResponse.json(
        { success: false, error: `Embedding生成に失敗しました: ${error.message}` },
        { status: 500 }
      )
    }

    if (embeddings.length !== existingChunks.length) {
      return NextResponse.json(
        { success: false, error: `Embedding数が一致しません: ${embeddings.length}個 / ${existingChunks.length}個` },
        { status: 500 }
      )
    }

    // チャンクを更新（Embeddingを更新）
    console.log('[Regenerate] チャンクのEmbeddingを更新中...')
    for (let i = 0; i < existingChunks.length; i++) {
      const { error: updateError } = await supabaseClient
        .from('chunks')
        .update({ embedding: embeddings[i] })
        .eq('id', existingChunks[i].id)

      if (updateError) {
        console.error(`[Regenerate] チャンク ${i} の更新エラー:`, updateError)
        return NextResponse.json(
          { success: false, error: `チャンクの更新に失敗しました: ${updateError.message}` },
          { status: 500 }
        )
      }
    }

    const processingTime = Date.now() - startTime
    console.log(`[Regenerate] 処理完了 (${processingTime}ms)`)

    return NextResponse.json({
      success: true,
      message: `${existingChunks.length}個のチャンクのEmbeddingを再生成しました`,
      chunksCount: existingChunks.length,
      processingTime,
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`[Regenerate] 処理エラー (${processingTime}ms):`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    )
  }
}

