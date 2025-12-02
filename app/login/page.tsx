'use client'

import { useState, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const { t } = useLanguage()
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.error || 'ログインに失敗しました')
      setLoading(false)
    } else {
      router.push(redirect)
    }
  }

  return (
    <main className="min-h-screen p-8 bg-wood-pattern relative overflow-hidden flex items-center justify-center">
      {/* 背景装飾 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full animate-pulse-slow"
          style={{
            background: 'radial-gradient(circle, rgba(212, 196, 168, 0.2) 0%, transparent 50%, transparent 100%)'
          }}
        ></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-wood-dark/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-wood-darker/10 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-wood-light p-8 border-4 border-wood-dark shadow-wood-lg rounded-lg">
          <div className="mb-8 text-center">
            <div className="inline-block animate-pulse-gentle mb-4 text-6xl">🌳</div>
            <h1 className="text-3xl font-bold text-wood-dark mb-2">
              {t('auth.login.title')}
            </h1>
            <p className="text-wood-darker text-sm">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-wood-darkest font-semibold mb-2">
                {t('auth.login.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-4 border-wood-dark rounded-lg bg-white text-wood-darkest focus:outline-none focus:ring-2 focus:ring-wood-dark"
                placeholder={t('auth.login.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-wood-darkest font-semibold mb-2">
                {t('auth.login.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-4 border-wood-dark rounded-lg bg-white text-wood-darkest focus:outline-none focus:ring-2 focus:ring-wood-dark"
                placeholder={t('auth.login.passwordPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-wood-dark text-wood-light border-4 border-wood-darker font-bold hover:bg-wood-darker shadow-wood-md transition-all transform hover:scale-105 hover:shadow-wood-lg disabled:bg-wood-darkest disabled:cursor-not-allowed disabled:transform-none rounded-lg"
            >
              {loading ? t('auth.login.loading') : t('auth.login.submit')}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-8 bg-wood-pattern relative overflow-hidden flex items-center justify-center">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-wood-light p-8 border-4 border-wood-dark shadow-wood-lg rounded-lg text-center">
            <div className="inline-block animate-pulse-gentle mb-4 text-6xl">🌳</div>
            <p className="text-wood-dark">読み込み中...</p>
          </div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}

