import { useEffect, type ComponentType } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AnalyticsPageLayout } from '../components/analytics/AnalyticsPageLayout'
import { AnalyticsChartFrame } from '../components/analytics/AnalyticsChartFrame'
import {
  FunnelChart,
  RetentionChart,
  SpeedChart,
} from '../components/analytics/AnalyticsCharts'
import { ANALYTICS_METRICS } from '../data/analyticsMetrics'
import { PortfolioCard } from '../components/PortfolioCard'
import VuePlayground from '../components/VuePlayground'
import { useAnalyticsSettings } from '../hooks/useAnalyticsSettings'
import { formatSettingsHint } from '../lib/analyticsSettingsStore'
import { TermHint } from '../components/TermTooltip'
import type { AnalyticsGlossaryKey } from '../data/analyticsGlossary'
import type { AnalyticsMetricId } from '../types/analytics'

const CHARTS: Record<
  AnalyticsMetricId,
  ComponentType<{ width: number; height: number }>
> = {
  retention: RetentionChart,
  funnel: FunnelChart,
  speed: SpeedChart,
}

const METRIC_GLOSSARY: Record<
  AnalyticsMetricId,
  { title: AnalyticsGlossaryKey; chart: AnalyticsGlossaryKey }
> = {
  retention: { title: 'userTraffic', chart: 'lineChart' },
  funnel: { title: 'funnelDropOff', chart: 'funnelMap' },
  speed: { title: 'performanceCro', chart: 'scatterPlot' },
}

export function AnalyticsPage() {
  const settings = useAnalyticsSettings()

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return
    const target = document.getElementById(hash)
    if (!target) return
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <AnalyticsPageLayout
      title="Analytics & Statistiken"
      subtitle="Vue-gesteuerte Parameter und SVG-Visualisierungen auf einer scrollbaren Seite – Änderungen wirken live auf alle Charts."
      chartLabel="Live gekoppelt"
    >
      <p className="text-[10px] font-mono text-cyan-400/90 border border-cyan-500/15 rounded-lg px-3 py-2 bg-cyan-500/5 mb-8">
        {formatSettingsHint(settings)}
      </p>

      <div className="analytics-hub-grid lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 lg:items-start">
        <aside className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24 space-y-4 mb-10 lg:mb-0 min-w-0 analytics-vue-panel">
          <div>
            <span className="text-xs font-mono text-violet-400 uppercase tracking-widest">
              Steuerung
            </span>
            <h2 className="heading-section text-xl font-extrabold tracking-tight mt-1">
              <TermHint glossaryKey="uxLift">Vue UX-Lift Rechner</TermHint>
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Slider anpassen – Traffic, Conversion-Rate und UX-Lift aktualisieren alle
              Visualisierungen rechts bzw. darunter in Echtzeit.
            </p>
          </div>
          <VuePlayground />
        </aside>

        <div className="lg:col-span-7 xl:col-span-7 space-y-8 w-full min-w-0">
          {ANALYTICS_METRICS.map((metric) => {
            const Chart = CHARTS[metric.id]
            const glossary = METRIC_GLOSSARY[metric.id]
            return (
              <section
                key={metric.id}
                id={metric.id}
                className="analytics-hub-section scroll-mt-28 space-y-3 w-full"
              >
                <div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-widest ${metric.accentClass}`}
                  >
                    <TermHint glossaryKey={glossary.chart} placement="tooltip-right">
                      {metric.chartLabel}
                    </TermHint>
                  </span>
                  <h2 className="heading-section text-lg md:text-xl font-extrabold tracking-tight mt-0.5">
                    <TermHint glossaryKey={glossary.title}>{metric.title}</TermHint>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{metric.subtitle}</p>
                </div>

                <PortfolioCard glow={metric.glow} hover={metric.hover} className="w-full">
                  <div className="p-3 md:p-4">
                    <AnalyticsChartFrame>
                      {(size) => <Chart width={size.width} height={size.height} />}
                    </AnalyticsChartFrame>
                  </div>
                </PortfolioCard>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 md:p-4">
                  <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                    Analytischer Mehrwert
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{metric.insight}</p>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </AnalyticsPageLayout>
  )
}

/** Alte Einzel-Routen → Hub mit Anker */
export function AnalyticsMetricRedirect() {
  const { metricId } = useParams<{ metricId: string }>()
  const valid = ANALYTICS_METRICS.some((m) => m.id === metricId)
  if (!valid) return <Navigate to="/analytics" replace />
  return <Navigate to={`/analytics#${metricId}`} replace />
}
