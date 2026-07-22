import { AnalyticsHubLink } from './analytics/AnalyticsHubLink'

export function DashboardDemos() {
  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
          Die empirische Perspektive
        </span>
        <h2 className="heading-section text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
          Interaktive Analytics
        </h2>
      </div>
      <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
        Vue-gesteuerte Parameter und SVG-Charts auf einer eigenen Seite – normal scrollbar, ohne
        Sektions-Wechsel.
      </p>
      <AnalyticsHubLink />
    </div>
  )
}
