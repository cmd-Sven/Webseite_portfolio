import type { ReactNode } from 'react'

/** Parallax-Mitbewegung an Scroll-Fortschritt der Sektion gekoppelt */
export function SectionRevealLayer({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`section-reveal-layer ${className}`.trim()}>{children}</div>
}

/** Direkte Kinder blenden gemeinsam ein (schneller Scroll-Reveal) */
export function RevealGroup({
  children,
  className = '',
  grid = false,
}: {
  children: ReactNode
  className?: string
  /** Grid-Layout-Variante (kein Stagger mehr) */
  grid?: boolean
}) {
  return (
    <div className={`reveal-group ${grid ? 'reveal-group--grid' : ''} ${className}`.trim()}>
      {children}
    </div>
  )
}
