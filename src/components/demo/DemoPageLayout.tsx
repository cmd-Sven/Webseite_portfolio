import { useEffect, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { BrandLogo } from '../BrandLogo'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { DemoLegend } from './DemoLegend'
import type { DemoGlossaryEntry } from '../../data/demoGlossary'

export type DemoId = 'analytics' | 'ab-test' | 'performance'

const DEMO_NAV: { id: DemoId; to: string; label: string }[] = [
  { id: 'analytics', to: '/demo/analytics', label: 'Conversion / UX-Lift' },
  { id: 'ab-test', to: '/demo/ab-test', label: 'A/B-Test' },
  { id: 'performance', to: '/demo/performance', label: 'Performance' },
]

interface DemoPageLayoutProps {
  activeDemo: DemoId
  title: string
  subtitle: string
  chartLabel?: string
  glossary?: DemoGlossaryEntry[]
  glossaryTitle?: string
  children: ReactNode
}

export function DemoPageLayout({
  activeDemo,
  title,
  subtitle,
  chartLabel,
  glossary,
  glossaryTitle,
  children,
}: DemoPageLayoutProps) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = `${title} | Sven Sieber`

    const { body, documentElement } = document
    const prevBodyOverflow = body.style.overflow
    const prevHtmlOverflow = documentElement.style.overflow

    body.style.overflow = 'auto'
    documentElement.style.overflow = 'auto'

    return () => {
      document.title = prevTitle
      body.style.overflow = prevBodyOverflow
      documentElement.style.overflow = prevHtmlOverflow
    }
  }, [title])

  return (
    <div className="demo-page analytics-page min-h-screen bg-slate-950 text-slate-100 font-sans overflow-y-auto">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl xl:max-w-[88rem] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <Link to="/" className="shrink-0" aria-label="Zur Startseite">
              <BrandLogo variant="mark" size="md" />
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-500/10 border border-cyan-500/25 rounded-full px-3.5 py-1.5"
            >
              <Home className="w-4 h-4" aria-hidden />
              Zurück zur Startseite
            </Link>

            <nav
              aria-label="Demo-Navigation"
              className="flex flex-wrap items-center gap-1 sm:gap-1.5 border-l border-slate-800 pl-3 sm:pl-4"
            >
              {DEMO_NAV.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    [
                      'text-xs sm:text-sm font-medium rounded-lg px-2.5 py-1.5 transition-colors',
                      isActive || activeDemo === item.id
                        ? 'text-slate-100 bg-slate-800/90 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeSwitcher compact />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden sm:inline">
              Live Demo
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl xl:max-w-[88rem] mx-auto px-6 py-10 md:py-14">
        <div className="mb-8">
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
            interaktive Analysen
          </span>
          <h1 className="heading-section text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
            {title}
          </h1>
          <p className="text-sm text-slate-400 mt-2">{subtitle}</p>
          {chartLabel ? (
            <span className="inline-block mt-3 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400/80 border border-cyan-500/20 rounded-full px-3 py-1">
              {chartLabel}
            </span>
          ) : null}
        </div>

        {children}

        {glossary?.length ? (
          <DemoLegend entries={glossary} title={glossaryTitle} />
        ) : null}
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
