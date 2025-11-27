import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Rikkyo School in England Insight AI System',
  description: 'Rikkyo School documents search and AI-powered Q&A system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <LanguageProvider>
          <NavBar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}

