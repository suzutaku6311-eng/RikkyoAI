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
    // 環境変数のチェック
    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid) {
      return NextResponse.json(
        { error: supabaseCheck.error },
        { status: 500 }
      )
    }

    const documentId = params.id

    if (!documentId) {
      return NextResponse.json(
        { error: '文書IDが指定されていません' },
        { status: 400 }
      )
    }

    // チャンクを削除（CASCADEで自動削除されるが、明示的に削除）
    const { error: chunksError } = await supabase
      .from('chunks')
      .delete()
      .eq('document_id', documentId)

    if (chunksError) {
      console.error('チャンク削除エラー:', chunksError)
      // 続行（CASCADEで削除される可能性があるため）
    }

    // 文書を削除
    const { error: docError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (docError) {
      console.error('文書削除エラー:', docError)
      return NextResponse.json(
        { error: '文書の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('文書削除エラー:', error)
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

