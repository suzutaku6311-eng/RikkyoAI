'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function NavBar() {
  const { t } = useLanguage()

  return (
    <nav className="bg-wood-dark border-b-4 border-wood-darker shadow-wood-md relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center px-4 py-2 text-xl font-bold text-wood-light hover:text-wood-lightest tracking-tight transition-colors"
            >
              <span className="text-2xl mr-2">🌳</span>
              <span className="border-b-2 border-wood-light pb-1">{t('app.name')}</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            <Link
              href="/ask"
              className="px-4 py-2 text-sm font-bold text-wood-light hover:text-wood-lightest hover:bg-wood-darker border-2 border-wood-darker shadow-wood-sm transition-all transform hover:scale-105 rounded-lg"
            >
              {t('nav.search')}
            </Link>
            <Link
              href="/admin/documents"
              className="px-4 py-2 text-sm font-bold text-wood-light hover:text-wood-lightest hover:bg-wood-darker border-2 border-wood-darker shadow-wood-sm transition-all transform hover:scale-105 rounded-lg"
            >
              {t('nav.documents')}
            </Link>
            <Link
              href="/admin/upload"
              className="px-4 py-2 text-sm font-bold text-wood-light hover:text-wood-lightest hover:bg-wood-darker border-2 border-wood-darker shadow-wood-sm transition-all transform hover:scale-105 rounded-lg"
            >
              {t('nav.upload')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

