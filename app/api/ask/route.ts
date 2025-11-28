import { NextRequest, NextResponse } from 'next/server'
import { searchSimilarChunks, generateAnswer } from '@/lib/rag'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'
import { checkOpenAIEnv } from '@/lib/openai'
import { requireAuth } from '@/lib/auth-helpers'
import type { ChunkSummary } from '@/lib/rag'

export const runtime = 'nodejs'

/**
 * RAG検索回答API
 * 入力: { question: string }
 * 出力: { answer: string, sources: ChunkSummary[] }
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック（認証ユーザー全員）
    const { error: authError, user } = await requireAuth(request)
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status }
      )
    }

    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      return NextResponse.json(
        { error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    // supabaseがnullでないことを確認（TypeScript用）
    const supabaseClient = supabase

    const openaiCheck = checkOpenAIEnv()
    if (!openaiCheck.isValid) {
      return NextResponse.json(
        { error: openaiCheck.error },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { question } = body

    console.log('質問を受信:', question)

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: '質問が指定されていません' },
        { status: 400 }
      )
    }

    // 類似チャンクを検索
    console.log('類似チャンクの検索を開始...')
    let chunks: any[] = []
    try {
      chunks = await searchSimilarChunks(question.trim(), 10)
      console.log(`検索結果: ${chunks.length}件のチャンクが見つかりました`)
    } catch (searchError) {
      console.error('検索エラー:', searchError)
      return NextResponse.json(
        {
          error: `検索エラー: ${searchError instanceof Error ? searchError.message : '不明なエラー'}`,
        },
        { status: 500 }
      )
    }

    if (chunks.length === 0) {
      console.log('関連するチャンクが見つかりませんでした')
      // チャンクの総数を確認
      const { count } = await supabaseClient
        .from('chunks')
        .select('*', { count: 'exact', head: true })
      
      console.log(`データベース内のチャンク総数: ${count || 0}`)
      
      // デバッグ情報を含めて返す
      return NextResponse.json({
        answer: '関連する文書が見つかりませんでした。別の質問を試してください。',
        sources: [],
        debug: {
          message: 'チャンクが見つかりませんでした',
          totalChunksInDB: count || 0,
          suggestion: 'ターミナルのログで「有効なチャンク」と「無効なチャンク」の数を確認してください',
        },
      })
    }

    // LLMで回答を生成
    console.log('LLM回答生成を開始...')
    const answer = await generateAnswer(question.trim(), chunks)
    console.log('LLM回答生成完了')

    const sourcesData = chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content.substring(0, 200) + '...', // プレビュー用に短縮
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      chunkIndex: chunk.chunkIndex,
      similarity: chunk.similarity,
    }))

    // 検索履歴を保存（エラーが発生しても処理は続行）
    try {
      await supabaseClient
        .from('search_history')
        .insert({
          question: question.trim(),
          answer: answer,
          user_id: user?.id, // 認証されたユーザーIDを設定
          chunks_used: chunks.map(c => ({
            id: c.id,
            documentId: c.documentId,
            documentTitle: c.documentTitle,
            similarity: c.similarity,
          })),
        })
      console.log('検索履歴を保存しました')
    } catch (historyError) {
      // 履歴保存のエラーは無視（テーブルが存在しない場合など）
      console.warn('検索履歴の保存に失敗しました（続行）:', historyError)
    }

    return NextResponse.json({
      answer,
      sources: sourcesData,
    })
  } catch (error) {
    console.error('RAG検索APIエラー:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '予期しないエラーが発生しました',
      },
      { status: 500 }
    )
  }
}

