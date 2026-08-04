import type { ReactNode } from 'react'

type SectionAccent = 'cyan' | 'violet' | 'emerald'

const ACCENT_CLASS: Record<SectionAccent, string> = {
  cyan: 'section-eyebrow--cyan',
  violet: 'section-eyebrow--violet',
  emerald: 'section-eyebrow--emerald',
}

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  lead?: ReactNode
  accent?: SectionAccent
  className?: string
}

/** Einheitlicher Headline-Block für Landingpage-Sektionen (Eyebrow + H2 + Lead). */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  accent = 'cyan',
  className = '',
}: SectionHeaderProps) {
  return (
    <header className={`section-header ${className}`.trim()}>
      {eyebrow ? (
        <span className={`section-eyebrow ${ACCENT_CLASS[accent]}`}>{eyebrow}</span>
      ) : null}
      <h2 className="heading-section section-heading">{title}</h2>
      {lead ? <p className="section-lead">{lead}</p> : null}
    </header>
  )
}
