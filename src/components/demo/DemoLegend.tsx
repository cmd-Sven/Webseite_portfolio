import type { DemoGlossaryEntry } from '../../data/demoGlossary'
import { GlossaryTermHint } from '../GlossaryTermHint'

interface DemoLegendProps {
  entries: DemoGlossaryEntry[]
  title?: string
}

export function DemoLegend({
  entries,
  title = 'Legende',
}: DemoLegendProps) {
  if (!entries.length) return null

  return (
    <section
      className="demo-legend mt-12 pt-8"
      style={{ borderTop: '1px solid var(--surface-border, #1e293b)' }}
      aria-labelledby="demo-legend-heading"
    >
      <h2
        id="demo-legend-heading"
        className="text-[11px] font-mono uppercase tracking-wider mb-4"
        style={{ color: 'var(--text-muted, #94a3b8)' }}
      >
        {title}
      </h2>

      <dl className="demo-legend__grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
        {entries.map((entry) => (
          <div key={entry.term} className="min-w-0">
            <dt
              className="text-xs font-semibold tracking-tight"
              style={{ color: 'var(--text-primary, #f8fafc)' }}
            >
              <GlossaryTermHint term={entry.term} description={entry.description} />
            </dt>
            <dd
              className="text-xs mt-1 leading-relaxed"
              style={{ color: 'var(--text-muted, #94a3b8)' }}
            >
              {entry.description}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
