import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // セッションを更新
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 保護が必要なパス（管理者のみ）
  const adminPaths = ['/admin', '/api/admin']
  // 認証が必要なパス（一般ユーザーもアクセス可能）
  const authRequiredPaths = ['/api/search-history']
  // 公開パス（認証不要）
  const publicPaths = ['/ask', '/api/ask']
  const authPaths = ['/login']
  const publicApiPaths = ['/api/auth/login', '/api/auth/logout', '/api/auth/me', '/api/health']

  const pathname = request.nextUrl.pathname
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))
  const isAuthRequiredPath = authRequiredPaths.some((path) => pathname.startsWith(path))
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))
  const isPublicApiPath = publicApiPaths.some((path) => pathname.startsWith(path))

  // 公開APIパスは認証チェックをスキップ
  if (isPublicApiPath) {
    return response
  }

  // 公開パス（/ask, /api/ask）は認証不要
  if (isPublicPath) {
    return response
  }

  // 管理者パスにアクセスしているが、認証されていない場合
  if (isAdminPath && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 管理者パスにアクセスしているが、管理者権限がない場合
  if (isAdminPath && user) {
    // ユーザープロフィールを取得して管理者権限を確認
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // 認証が必要なパス（検索履歴など）にアクセスしているが、認証されていない場合
  if (isAuthRequiredPath && !user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    )
  }

  // ログインページにアクセスしているが、既に認証されている場合
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

