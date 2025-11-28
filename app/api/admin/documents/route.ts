import { NextRequest, NextResponse } from 'next/server'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth-helpers'

export const runtime = 'nodejs'
// キャッシュを無効化して常に最新データを返す
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * 文書一覧取得API
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Documents API] 文書一覧取得開始')
    
    // 認証チェック（管理者のみ）
    const { error: authError } = await requireAdmin(request)
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status }
      )
    }
    
    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      console.error('[Documents API] Supabase環境変数エラー:', supabaseCheck.error)
      return NextResponse.json(
        { error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    // supabaseがnullでないことを確認（TypeScript用）
    const supabaseClient = supabase

    // 文書一覧を取得
    console.log('[Documents API] Supabaseから文書を取得中...')
    const { data: documents, error: docsError } = await supabaseClient
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (docsError) {
      console.error('[Documents API] 文書取得エラー:', docsError)
      return NextResponse.json(
        { error: `文書の取得に失敗しました: ${docsError.message}` },
        { status: 500 }
      )
    }

    console.log(`[Documents API] 文書取得完了: ${documents?.length || 0}件`)

    // 各文書のチャンク数を取得
    console.log('[Documents API] チャンク数を取得中...')
    const documentsWithChunks = await Promise.all(
      (documents || []).map(async (doc) => {
        const { count, error: chunksError } = await supabaseClient
          .from('chunks')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', doc.id)

        if (chunksError) {
          console.warn(`[Documents API] チャンク数取得エラー (文書ID: ${doc.id}):`, chunksError)
        }

        return {
          ...doc,
          chunksCount: chunksError ? 0 : count || 0,
        }
      })
    )

    console.log(`[Documents API] 処理完了: ${documentsWithChunks.length}件の文書を返します`)

    return NextResponse.json({
      documents: documentsWithChunks,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[Documents API] 予期しないエラー:', error)
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

