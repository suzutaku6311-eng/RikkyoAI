import { NextRequest, NextResponse } from 'next/server'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * 文書削除API
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[Delete API] 削除処理開始')
    
    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      console.error('[Delete API] Supabase環境変数エラー:', supabaseCheck.error)
      return NextResponse.json(
        { error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    // supabaseがnullでないことを確認（TypeScript用）
    const supabaseClient = supabase

    const documentId = params.id
    console.log('[Delete API] 削除対象文書ID:', documentId)

    if (!documentId) {
      console.error('[Delete API] 文書IDが指定されていません')
      return NextResponse.json(
        { error: '文書IDが指定されていません' },
        { status: 400 }
      )
    }

    // チャンクを削除（CASCADEで自動削除されるが、明示的に削除）
    console.log('[Delete API] チャンクを削除中...')
    const { error: chunksError, count: deletedChunksCount } = await supabaseClient
      .from('chunks')
      .delete({ count: 'exact' })
      .eq('document_id', documentId)

    if (chunksError) {
      console.warn('[Delete API] チャンク削除エラー（続行）:', chunksError)
      // 続行（CASCADEで削除される可能性があるため）
    } else {
      console.log(`[Delete API] チャンク削除完了: ${deletedChunksCount || 0}件`)
    }

    // 文書を削除
    console.log('[Delete API] 文書を削除中...')
    const { error: docError, count: deletedDocCount } = await supabaseClient
      .from('documents')
      .delete({ count: 'exact' })
      .eq('id', documentId)

    if (docError) {
      console.error('[Delete API] 文書削除エラー:', docError)
      return NextResponse.json(
        { error: `文書の削除に失敗しました: ${docError.message}` },
        { status: 500 }
      )
    }

    if (deletedDocCount === 0) {
      console.warn('[Delete API] 削除された文書が0件です（既に削除されている可能性）')
      return NextResponse.json(
        { error: '文書が見つかりませんでした（既に削除されている可能性があります）' },
        { status: 404 }
      )
    }

    console.log(`[Delete API] 削除成功: 文書1件、チャンク${deletedChunksCount || 0}件`)
    return NextResponse.json({ 
      success: true,
      deletedDocumentCount: deletedDocCount,
      deletedChunksCount: deletedChunksCount || 0,
    })
  } catch (error) {
    console.error('[Delete API] 予期しないエラー:', error)
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

