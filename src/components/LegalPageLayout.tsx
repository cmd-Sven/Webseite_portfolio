// Rechtstexte: der einzige Ort, an dem „muss so“ wirklich stimmt. Augenzwinkern optional.
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'
import { ThemeSwitcher } from './ThemeSwitcher'

interface LegalPageLayoutProps {
  title: string
  children: ReactNode
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = `${title} | Sven Sieber`
    document.body.style.overflowY = 'auto'
    return () => {
      document.title = prevTitle
      document.body.style.overflowY = ''
    }
  }, [title])

  return (
    <div className="legal-page min-h-screen bg-slate-950 text-slate-100 font-sans overflow-y-auto">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Portfolio
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <ThemeSwitcher compact />
            <Link to="/" className="shrink-0" aria-label="Zur Startseite">
              <BrandLogo variant="mark" size="sm" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="heading-section text-3xl font-extrabold tracking-tight mb-8">{title}</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300 leading-relaxed">
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-16 py-8 text-center text-[10px] text-slate-500 font-mono">
        © 2026 Sven Sieber ·{' '}
        <Link to="/impressum" className="hover:text-cyan-400">
          Impressum
        </Link>
        {' · '}
        <Link to="/datenschutz" className="hover:text-cyan-400">
          Datenschutz
        </Link>
      </footer>
    </div>
  )
}
