'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('ja')}
        className={`px-3 py-1 text-sm font-bold rounded-lg transition-all ${
          language === 'ja'
            ? 'bg-wood-light text-wood-darkest border-2 border-wood-darker shadow-wood-sm'
            : 'bg-wood-darker text-wood-light border-2 border-wood-darkest hover:bg-wood-dark'
        }`}
      >
        日本語
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-sm font-bold rounded-lg transition-all ${
          language === 'en'
            ? 'bg-wood-light text-wood-darkest border-2 border-wood-darker shadow-wood-sm'
            : 'bg-wood-darker text-wood-light border-2 border-wood-darkest hover:bg-wood-dark'
        }`}
      >
        English
      </button>
    </div>
  )
}

