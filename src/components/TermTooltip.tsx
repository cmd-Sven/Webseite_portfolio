import type { ReactNode } from 'react'
import { ANALYTICS_GLOSSARY, type AnalyticsGlossaryKey } from '../data/analyticsGlossary'

interface TermHintProps {
  glossaryKey: AnalyticsGlossaryKey
  children?: ReactNode
  className?: string
  placement?: 'tooltip-top' | 'tooltip-bottom' | 'tooltip-left' | 'tooltip-right'
}

export function TermHint({
  glossaryKey,
  children,
  className = '',
  placement = 'tooltip-top',
}: TermHintProps) {
  const entry = ANALYTICS_GLOSSARY[glossaryKey]

  return (
    <span
      className={`tooltip ${placement} term-hint ${className}`}
      data-tip={entry.description}
    >
      <span className="term-hint__label border-b border-dashed border-slate-500/60 cursor-help">
        {children ?? entry.term}
      </span>
    </span>
  )
}
