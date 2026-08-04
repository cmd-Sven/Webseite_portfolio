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

interface SectionNavProps {
  activeSection: string
  onNavigate: (id: string) => void
}

export function SectionNav({ activeSection, onNavigate }: SectionNavProps) {
  return (
    <nav
      aria-label="Sektionsnavigation"
      className="viewport-chrome-nav section-nav"
    >
      {NAV_SECTIONS.map((sec) => {
        const Icon = SECTION_ICONS[sec.id] ?? Home
        const isActive = activeSection === sec.id

        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => onNavigate(sec.id)}
            className={`section-nav__btn group ${isActive ? 'section-nav__btn--active' : ''}`}
            aria-label={`Zu Abschnitt ${sec.title}`}
            aria-current={isActive ? 'true' : undefined}
          >
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
