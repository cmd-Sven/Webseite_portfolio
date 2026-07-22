import type { AnalyticsMetric, AnalyticsMetricId } from '../types/analytics'

export const ANALYTICS_METRICS: AnalyticsMetric[] = [
  {
    id: 'retention',
    path: '/analytics#retention',
    title: 'User Traffic (Wochenverlauf)',
    chartLabel: 'Line Chart',
    subtitle: 'Aktive Sitzungen über die Woche',
    insight:
      'Visualisiert den wöchentlichen Anstieg der aktiven Sitzungen nach dem Redesign.',
    glow: 'card-glow--cyan-violet',
    hover: 'cyan',
    accentClass: 'text-cyan-400',
    icon: 'users',
  },
  {
    id: 'funnel',
    path: '/analytics#funnel',
    title: 'Conversion Funnel Drop-off',
    chartLabel: 'Funnel Map',
    subtitle: 'Absprünge entlang der Customer Journey',
    insight:
      'Identifiziert genau, wo Nutzer abspringen, um gezielte UX-Optimierungen anzusetzen.',
    glow: 'card-glow--violet-cyan',
    hover: 'violet',
    accentClass: 'text-violet-400',
    icon: 'target',
  },
  {
    id: 'speed',
    path: '/analytics#speed',
    title: 'Performance vs CRO Impact',
    chartLabel: 'Scatter Plot',
    subtitle: 'Ladezeit und Conversion-Rate im Vergleich',
    insight:
      'Beweist empirisch: Jede 100ms Ladezeit-Optimierung erhöht die CR statistisch messbar.',
    glow: 'card-glow--emerald-cyan',
    hover: 'emerald',
    accentClass: 'text-emerald-400',
    icon: 'trending',
  },
]

export function getAnalyticsMetric(id: string): AnalyticsMetric | undefined {
  return ANALYTICS_METRICS.find((m) => m.id === id)
}

export function isAnalyticsMetricId(id: string): id is AnalyticsMetricId {
  return ANALYTICS_METRICS.some((m) => m.id === id)
}
