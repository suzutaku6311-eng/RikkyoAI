import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

/**
 * 登録済みスプレッドシート一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
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

