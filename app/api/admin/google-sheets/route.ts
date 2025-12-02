import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 登録済みスプレッドシート一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    // ビルド時や環境変数が設定されていない場合は空配列を返す
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ sources: [] })
    }

    const supabase = getSupabaseServerClient()

    const { data: sources, error } = await supabase
      .from('google_sheets_sources')
      .select(`
        *,
        documents (
          id,
          title,
          file_name,
          uploaded_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Google Sheets] 一覧取得エラー:', error)
      return NextResponse.json(
        { error: 'スプレッドシート一覧の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sources: sources || [],
    })
  } catch (error: any) {
    console.error('[Google Sheets] 一覧取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'スプレッドシート一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

