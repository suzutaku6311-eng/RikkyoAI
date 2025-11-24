import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * 文書一覧取得API
 */
export async function GET() {
  try {
    // 文書一覧を取得
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (docsError) {
      console.error('文書取得エラー:', docsError)
      return NextResponse.json(
        { error: '文書の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 各文書のチャンク数を取得
    const documentsWithChunks = await Promise.all(
      (documents || []).map(async (doc) => {
        const { count, error: chunksError } = await supabase
          .from('chunks')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', doc.id)

        return {
          ...doc,
          chunksCount: chunksError ? 0 : count || 0,
        }
      })
    )

    return NextResponse.json({
      documents: documentsWithChunks,
    })
  } catch (error) {
    console.error('文書一覧取得エラー:', error)
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

