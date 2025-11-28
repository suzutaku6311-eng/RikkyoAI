import { NextRequest, NextResponse } from 'next/server'
import { supabase, checkSupabaseEnv } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 検索履歴取得API
 * GET: 検索履歴一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック（認証ユーザー全員）
    const { error: authError, user } = await requireAuth(request)
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status }
      )
    }

    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      return NextResponse.json(
        { error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    const supabaseClient = supabase

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // 自分の検索履歴のみ取得
    const { data: history, error } = await supabaseClient
      .from('search_history')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // テーブルが存在しない場合は空配列を返す
      if (error.code === '42P01') {
        return NextResponse.json({ history: [] })
      }
      console.error('検索履歴取得エラー:', error)
      return NextResponse.json(
        { error: '検索履歴の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ history: history || [] })
  } catch (error) {
    console.error('検索履歴APIエラー:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * 検索履歴削除API
 * DELETE: 指定されたIDの検索履歴を削除
 */
export async function DELETE(request: NextRequest) {
  try {
    // 認証チェック（認証ユーザー全員）
    const { error: authError, user } = await requireAuth(request)
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: authError.status }
      )
    }

    const supabaseCheck = checkSupabaseEnv()
    if (!supabaseCheck.isValid || !supabase) {
      return NextResponse.json(
        { error: supabaseCheck.error || 'Supabase client is not initialized' },
        { status: 500 }
      )
    }

    const supabaseClient = supabase

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      )
    }

    // 自分の検索履歴のみ削除可能
    const { error } = await supabaseClient
      .from('search_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) {
      console.error('検索履歴削除エラー:', error)
      return NextResponse.json(
        { error: '検索履歴の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('検索履歴削除APIエラー:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

