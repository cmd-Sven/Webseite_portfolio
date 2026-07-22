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

/** Direkte Kinder blenden nacheinander ein (gestaffelt) */
export function RevealGroup({
  children,
  className = '',
  grid = false,
}: {
  children: ReactNode
  className?: string
  /** Stagger für Grid-/Card-Kinder */
  grid?: boolean
}) {
  return (
    <div className={`reveal-group ${grid ? 'reveal-group--grid' : ''} ${className}`.trim()}>
      {children}
    </div>
  )
}
