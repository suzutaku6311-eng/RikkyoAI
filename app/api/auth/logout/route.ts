import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 現在のユーザーを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // ログアウト
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Auth] ログアウトエラー:', error)
      return NextResponse.json(
        { error: error.message || 'ログアウトに失敗しました' },
        { status: 500 }
      )
    }

    // アクセスログに記録
    if (user) {
      await supabase.from('access_logs').insert({
        user_id: user.id,
        action: 'logout',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'ログアウトしました',
    })
  } catch (error: any) {
    console.error('[Auth] 予期しないエラー:', error)
    return NextResponse.json(
      { error: error.message || 'ログアウト処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

