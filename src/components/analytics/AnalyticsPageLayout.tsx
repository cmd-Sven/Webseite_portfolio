import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { ThemeSwitcher } from '../ThemeSwitcher'

interface AnalyticsPageLayoutProps {
  title: string
  subtitle: string
  chartLabel: string
  children: ReactNode
}

export function AnalyticsPageLayout({
  title,
  subtitle,
  chartLabel,
  children,
}: AnalyticsPageLayoutProps) {
  useEffect(() => {
    const { body, documentElement } = document
    const prevBodyOverflow = body.style.overflow
    const prevHtmlOverflow = documentElement.style.overflow

    body.style.overflow = 'auto'
    documentElement.style.overflow = 'auto'

    return () => {
      body.style.overflow = prevBodyOverflow
      documentElement.style.overflow = prevHtmlOverflow
    }
  }, [])

  return (
    <div className="analytics-page min-h-screen bg-slate-950 text-slate-100 font-sans overflow-y-auto">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 border border-cyan-500/25 rounded-full px-4 py-2"
          >
            <Home className="w-4 h-4" aria-hidden />
            Zurück zur Startseite
          </Link>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeSwitcher compact />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline">
              Live Demo
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 md:py-14">
        <div className="mb-8">
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
            Interaktive Analytics
          </span>
          <h1 className="heading-section text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
            {title}
          </h1>
          <p className="text-sm text-slate-400 mt-2">{subtitle}</p>
          <span className="inline-block mt-3 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400/80 border border-cyan-500/20 rounded-full px-3 py-1">
            {chartLabel}
          </span>
        </div>

        {children}
      </main>

      <footer className="border-t border-slate-800 py-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>
      </footer>
    </div>
  )
}
