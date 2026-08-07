// Seitenleiste mit Orientierungssinn — weiß meistens, wo du bist. Manchmal besser als wir.
import { useEffect, useState } from 'react'
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Compass,
  Cpu,
  Home,
  Mail,
  User,
  type LucideIcon,
} from 'lucide-react'
import { NAV_SECTIONS } from '../data/navigation'

const SECTION_ICONS: Record<string, LucideIcon> = {
  hero: Home,
  about: User,
  expertise: Compass,
  techstack: Cpu,
  dashboard: BarChart3,
  projects: Briefcase,
  blog: BookOpen,
  contact: Mail,
}

/** Stagger + Label-Flash → icon-only settled */
const REVEAL_SETTLE_MS = 2400

type RevealState = 'pending' | 'playing' | 'done'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

interface SectionNavProps {
  activeSection: string
  onNavigate: (id: string) => void
  /** true ab Intro-Phase `sliding`/`nav` — startet den Aufbau */
  introReady?: boolean
  /** Wiederbesuch / reduced-motion: sofort icon-only, kein Label-Flash */
  skipReveal?: boolean
}

export function SectionNav({
  activeSection,
  onNavigate,
  introReady = true,
  skipReveal = false,
}: SectionNavProps) {
  const [reveal, setReveal] = useState<RevealState>(() => {
    if (skipReveal || prefersReducedMotion()) return 'done'
    return introReady ? 'playing' : 'pending'
  })

  useEffect(() => {
    if (skipReveal || prefersReducedMotion()) {
      setReveal('done')
      return
    }
    if (!introReady) {
      setReveal('pending')
      return
    }

    setReveal('playing')
    const settle = window.setTimeout(() => setReveal('done'), REVEAL_SETTLE_MS)
    return () => window.clearTimeout(settle)
  }, [introReady, skipReveal])

  const interactive = reveal !== 'pending'

  return (
    <nav
      aria-label="Sektionsnavigation"
      className="viewport-chrome-nav section-nav"
      data-reveal={reveal}
      aria-hidden={!interactive}
      {...(!interactive ? { inert: true } : {})}
    >
      {NAV_SECTIONS.map((sec, index) => {
        const Icon = SECTION_ICONS[sec.id] ?? Home
        const isActive = activeSection === sec.id

        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => onNavigate(sec.id)}
            className={`section-nav__btn group ${isActive ? 'section-nav__btn--active' : ''}`}
            style={{ ['--nav-i' as string]: index }}
            aria-label={`Zu Abschnitt ${sec.title}`}
            aria-current={isActive ? 'true' : undefined}
            tabIndex={interactive ? undefined : -1}
          >
            <span className="section-nav__intro-label" aria-hidden>
              {sec.title}
            </span>
            <span className="nav-tooltip" role="tooltip">
              <span className="nav-tooltip__title">{sec.title}</span>
              <span className="nav-tooltip__subtitle">{sec.subtitle}</span>
            </span>
            <span className={`nav-icon ${isActive ? 'nav-icon--active' : ''}`}>
              <Icon className="nav-icon__svg" aria-hidden />
            </span>
          </button>
        )
      })}
    </nav>
  )
}
