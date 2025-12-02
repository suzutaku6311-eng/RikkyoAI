import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase環境変数が設定されていません' },
        { status: 500 }
      )
    }

    // レスポンスオブジェクトを先に作成（Cookie設定のため）
    const response = NextResponse.json({ success: true })

    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    // ログイン
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[Auth] ログインエラー:', error)
      
      // エラーメッセージを日本語化
      let errorMessage = 'ログインに失敗しました'
      
      if (error.message) {
        const message = error.message.toLowerCase()
        if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません'
        } else if (message.includes('email not confirmed')) {
          errorMessage = 'メールアドレスが確認されていません。メールを確認してください。'
        } else if (message.includes('user not found')) {
          errorMessage = 'ユーザーが見つかりません。Supabaseでユーザーを作成してください。'
        } else if (message.includes('too many requests')) {
          errorMessage = 'ログイン試行回数が多すぎます。しばらく待ってから再度お試しください。'
        } else {
          errorMessage = error.message
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'ログインに失敗しました' },
        { status: 401 }
      )
    }

    // ユーザープロフィールを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('[Auth] プロフィール取得エラー:', profileError)
    }

    // 最終ログイン時刻を更新
    if (profile) {
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    // アクセスログに記録（エラーが発生しても続行）
    try {
      await supabase.from('access_logs').insert({
        user_id: data.user.id,
        action: 'login',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      })
    } catch (logError) {
      console.warn('[Auth] アクセスログの記録に失敗しました（続行します）:', logError)
    }

    console.log('[Auth] ログイン成功:', {
      userId: data.user.id,
      email: data.user.email,
      role: profile?.role || 'user',
    })

    // 既存のレスポンスオブジェクトのボディを更新（Cookieは既に設定済み）
    const responseData = {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.email?.split('@')[0] || 'User',
        role: profile?.role || 'user',
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    }

    response.headers.set('Content-Type', 'application/json')
    response.body = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        const jsonData = JSON.stringify(responseData)
        controller.enqueue(encoder.encode(jsonData))
        controller.close()
      },
    })

    return response
  } catch (error: any) {
    console.error('[Auth] 予期しないエラー:', error)
    return NextResponse.json(
      { error: error.message || 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

