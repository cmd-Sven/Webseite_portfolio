export type AnalyticsMetricId = 'retention' | 'funnel' | 'speed'

export interface AnalyticsMetric {
  id: AnalyticsMetricId
  path: string
  title: string
  chartLabel: string
  subtitle: string
  insight: string
  glow: string
  hover: 'cyan' | 'violet' | 'emerald'
  accentClass: string
  icon: 'users' | 'target' | 'trending'
}
