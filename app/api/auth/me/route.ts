import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    // ユーザープロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Auth] プロフィール取得エラー:', profileError)
      return NextResponse.json(
        { error: 'ユーザープロフィールの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.email?.split('@')[0] || 'User',
        role: profile?.role || 'user',
        is_active: profile?.is_active ?? true,
        last_login_at: profile?.last_login_at,
      },
    })
  } catch (error: any) {
    console.error('[Auth] 予期しないエラー:', error)
    return NextResponse.json(
      { error: error.message || 'ユーザー情報の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

