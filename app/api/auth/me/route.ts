import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase環境変数が設定されていません' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    
    // Cookieの確認（デバッグ用）
    const allCookies = cookieStore.getAll()
    console.log('[Auth] 受信したCookie数:', allCookies.length)
    allCookies.forEach(({ name }) => {
      console.log('[Auth] Cookie:', name)
    })
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentsではcookieの設定はできない場合がある
          }
        },
      },
    })

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('[Auth] getUserエラー:', userError.message)
      console.error('[Auth] エラーコード:', userError.status)
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    if (!user) {
      console.log('[Auth] ユーザーが認証されていません')
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      )
    }

    console.log('[Auth] ユーザー認証成功:', {
      userId: user.id,
      email: user.email,
    })

    // ユーザープロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Auth] プロフィール取得エラー:', profileError)
      console.error('[Auth] ユーザーID:', user.id)
      console.error('[Auth] エラーコード:', profileError.code)
      console.error('[Auth] エラーメッセージ:', profileError.message)
      console.error('[Auth] エラー詳細:', JSON.stringify(profileError, null, 2))
      
      // プロフィールが存在しない場合は、デフォルトのroleを返す
      // ただし、これは一時的な対応で、本来はuser_profilesテーブルにプロフィールを作成する必要がある
      if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
        console.warn('[Auth] プロフィールが存在しません。デフォルトのroleを返します。')
        console.warn('[Auth] ユーザープロフィールを作成する必要があります。Supabase SQL Editorで以下を実行してください:')
        console.warn(`[Auth] INSERT INTO public.user_profiles (id, email, name, role) VALUES ('${user.id}', '${user.email}', '${user.email?.split('@')[0] || 'User'}', 'admin') ON CONFLICT (id) DO UPDATE SET role = 'admin';`)
        
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'User',
            role: 'user', // デフォルトは'user'（プロフィールが存在しない場合）
            is_active: true,
            last_login_at: null,
          },
        })
      }
      
      // その他のエラー（RLSポリシーエラーなど）の場合も、デフォルトのroleを返す
      console.warn('[Auth] プロフィール取得に失敗しましたが、デフォルトのroleを返します。')
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.email?.split('@')[0] || 'User',
          role: 'user', // デフォルトは'user'
          is_active: true,
          last_login_at: null,
        },
      })
    }

    console.log('[Auth] ユーザープロフィール取得成功:', {
      id: profile?.id,
      email: profile?.email,
      name: profile?.name,
      role: profile?.role,
      is_active: profile?.is_active,
    })

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

