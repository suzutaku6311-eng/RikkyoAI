import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * サーバーサイドで認証されたユーザーを取得
 */
export async function getAuthenticatedUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const cookieStore = await cookies()
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // ユーザープロフィールを取得
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email || '',
    name: profile?.name || user.email?.split('@')[0] || 'User',
    role: (profile?.role as 'user' | 'admin' | 'super_admin') || 'user',
    is_active: profile?.is_active ?? true,
  }
}

/**
 * APIエンドポイントで認証チェック
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      error: { message: '認証が必要です', status: 401 },
      user: null,
    }
  }

  return { error: null, user }
}

/**
 * 管理者権限チェック
 */
export async function requireAdmin(request: NextRequest) {
  const { error, user } = await requireAuth(request)

  if (error) {
    return { error, user: null }
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return {
      error: { message: '管理者権限が必要です', status: 403 },
      user: null,
    }
  }

  return { error: null, user }
}

/**
 * スーパー管理者権限チェック
 */
export async function requireSuperAdmin(request: NextRequest) {
  const { error, user } = await requireAuth(request)

  if (error) {
    return { error, user: null }
  }

  if (!user || user.role !== 'super_admin') {
    return {
      error: { message: 'スーパー管理者権限が必要です', status: 403 },
      user: null,
    }
  }

  return { error: null, user }
}

