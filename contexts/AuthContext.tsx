'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  email: string
  name: string
  role: 'user' | 'admin' | 'super_admin'
  is_active: boolean
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAdmin: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[Auth] ユーザー情報を取得:', data.user)
        setUser(data.user)
      } else {
        console.warn('[Auth] ユーザー情報取得失敗:', response.status, response.statusText)
        setUser(null)
      }
    } catch (error) {
      console.error('[Auth] ユーザー情報取得エラー:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'ログインに失敗しました' }
      }

      console.log('[Auth] ログイン成功、ユーザー情報を設定:', data.user)
      setUser(data.user)

      // ログイン後、Cookieが反映されるまで少し待ってからユーザー情報を再取得
      // ただし、ログインAPIから返されたユーザー情報を優先的に使用
      setTimeout(async () => {
        try {
          await refreshUser()
        } catch (error) {
          console.warn('[Auth] ユーザー情報の再取得に失敗しました（ログインAPIの情報を使用）:', error)
        }
      }, 500)

      router.push('/')
      router.refresh()

      return { success: true }
    } catch (error: any) {
      console.error('[Auth] ログインエラー:', error)
      return { success: false, error: error.message || 'ログイン処理中にエラーが発生しました' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('[Auth] ログアウトエラー:', error)
    }
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isSuperAdmin = user?.role === 'super_admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

