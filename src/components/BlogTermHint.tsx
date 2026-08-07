import type { ReactNode } from 'react'
import { getBlogGlossaryEntry } from '../data/blogGlossary'
import { GlossaryTermHint } from './GlossaryTermHint'

interface BlogTermHintProps {
  termKey: string
  /** Optional: abweichendes Label im Fließtext */
  children?: ReactNode
}

export function BlogTermHint({ termKey, children }: BlogTermHintProps) {
  const entry = getBlogGlossaryEntry(termKey)

  if (!entry) {
    return <>{children ?? termKey}</>
  }

  return (
    <GlossaryTermHint term={entry.term} description={entry.description}>
      {children}
    </GlossaryTermHint>
  )
}
