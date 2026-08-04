import { AnalyticsHubLink } from './analytics/AnalyticsHubLink'

const DEMO_PREVIEW = [
  {
    label: 'Wochenverlauf',
    detail: 'Sitzungen über Mo–So, skaliert mit Traffic und UX-Lift',
  },
  {
    label: 'Conversion-Funnel',
    detail: 'Drop-offs von Startseite bis Checkout – Conversion-Rate wirkt auf die Stufen',
  },
  {
    label: 'Performance ↔ CRO',
    detail: 'Ladezeit gegen Conversion-Rate – Simulation eines Speed-Impact',
  },
] as const

export function DashboardDemos() {
  return (
    <div className="space-y-5 max-w-xl">
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-400">
          Simuliert wird eine kleine Conversion-Welt: dieselbe Vue-Steuerung speist drei SVG-Analysen.
          Du änderst die Annahmen – Charts und KPIs aktualisieren sich in Echtzeit.
        </p>
        <ul className="space-y-2.5 border-l border-cyan-500/25 pl-4">
          {DEMO_PREVIEW.map((item) => (
            <li key={item.label} className="text-xs leading-relaxed text-slate-400">
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
