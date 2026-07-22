import type { ReactNode } from 'react'

type GlowHover = 'cyan' | 'violet' | 'emerald'

interface PortfolioCardProps {
  glow: string
  hover?: GlowHover
  className?: string
  children: ReactNode
}

const HOVER_CLASS: Record<GlowHover, string> = {
  cyan: 'portfolio-card--cyan',
  violet: 'portfolio-card--violet',
  emerald: 'portfolio-card--emerald',
}

/** Glow außen, undurchsichtige glossy Fläche innen – kein ::after-Konflikt */
export function PortfolioCard({
  glow,
  hover = 'cyan',
  className = '',
  children,
}: PortfolioCardProps) {
  const isCompact = className.includes('portfolio-card--compact')
  return (
    <div
      className={`card-glow ${glow} ${isCompact ? 'card-glow--compact rounded-xl' : 'rounded-2xl'}`}
    >
      <div
        className={`glass-panel portfolio-card transition-all duration-300 ${HOVER_CLASS[hover]} ${
          isCompact ? 'rounded-xl' : 'rounded-2xl'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

export function PortfolioCardSm({
  glow,
  className = '',
  children,
}: {
  glow: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`card-glow card-glow--compact ${glow} rounded-xl`}>
      <div
        className={`glass-panel portfolio-card portfolio-card-sm rounded-xl transition-all duration-300 ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
