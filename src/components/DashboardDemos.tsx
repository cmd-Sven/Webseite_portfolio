import type { ReactNode } from 'react'
import { AnalyticsHubLink } from './analytics/AnalyticsHubLink'
import { BlogTermHint } from './BlogTermHint'

const DEMO_PREVIEW: { label: ReactNode; detail: ReactNode }[] = [
  {
    label: 'Wochenverlauf',
    detail: 'Sitzungen über Mo–So, skaliert mit Traffic und UX-Lift',
  },
  {
    label: 'Conversion-Funnel',
    detail: (
      <>
        Drop-offs von Startseite bis <BlogTermHint termKey="Checkout" /> –{' '}
        <BlogTermHint termKey="Conversion-Rate" /> wirkt auf die Stufen
      </>
    ),
  },
  {
    label: (
      <>
        Performance ↔ <BlogTermHint termKey="CRO" />
      </>
    ),
    detail: (
      <>
        Ladezeit gegen Conversion-Rate – inkl. <BlogTermHint termKey="Core Web Vitals" /> und{' '}
        <BlogTermHint termKey="Bounce-Rate" />
      </>
    ),
  },
]

export function DashboardDemos() {
  return (
    <div className="space-y-5 max-w-xl">
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-400">
          Demo 1: Conversion-Welt mit Vue-Steuerung und drei Analysen als{' '}
          <BlogTermHint termKey="SVG" />. Demo 2: zwei Varianten für den{' '}
          <BlogTermHint termKey="CTA" /> inkl. Statistik. Demo 3: Ladezeit vs. Bounce – Tech-Hebel als
          Business-Wirkung.
        </p>
        <ul className="space-y-2.5 border-l border-cyan-500/25 pl-4">
          {DEMO_PREVIEW.map((item, index) => (
            <li key={index} className="text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-200">{item.label}</span>
              <span className="text-slate-500"> — </span>
              {item.detail}
            </li>
          ))}
        </ul>
      </div>
      <AnalyticsHubLink />
    </div>
  )
}
