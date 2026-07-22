export interface AnalyticsSettings {
  traffic: number
  conversionRate: number
  avgOrderValue: number
  uxLift: number
}

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  traffic: 15000,
  conversionRate: 1.8,
  avgOrderValue: 45,
  uxLift: 25,
}

const BASE_TRAFFIC = DEFAULT_ANALYTICS_SETTINGS.traffic
const BASE_CONVERSION = DEFAULT_ANALYTICS_SETTINGS.conversionRate
const BASE_FUNNEL_END = 3.2
const BASE_UX_LIFT = DEFAULT_ANALYTICS_SETTINGS.uxLift

const STORE_KEY = '__portfolioAnalyticsStore__'

type StoreSnapshot = {
  settings: AnalyticsSettings
  listeners: Set<() => void>
}

function getStore(): StoreSnapshot {
  const root = globalThis as typeof globalThis & { [STORE_KEY]?: StoreSnapshot }
  if (!root[STORE_KEY]) {
    root[STORE_KEY] = {
      settings: { ...DEFAULT_ANALYTICS_SETTINGS },
      listeners: new Set(),
    }
  }
  return root[STORE_KEY]
}

function emit() {
  getStore().listeners.forEach((listener) => listener())
}

/** Verstärkt Abweichungen vom Default – Slider wirken in den Charts deutlicher */
const SENSITIVITY = {
  traffic: 2.6,
  conversion: 3.2,
  uxLift: 2.8,
} as const

function amplifiedRatio(value: number, base: number, sensitivity: number): number {
  return 1 + (value / base - 1) * sensitivity
}

export function getAnalyticsSettings(): AnalyticsSettings {
  return getStore().settings
}

export function setAnalyticsSettings(partial: Partial<AnalyticsSettings>): void {
  const store = getStore()
  store.settings = { ...store.settings, ...partial }
  emit()
}

export function subscribeAnalyticsSettings(listener: () => void): () => void {
  const store = getStore()
  store.listeners.add(listener)
  return () => store.listeners.delete(listener)
}

export function buildRetentionData(s: AnalyticsSettings) {
  const base = [
    { label: 'Mo', value: 1200 },
    { label: 'Di', value: 1450 },
    { label: 'Mi', value: 1900 },
    { label: 'Do', value: 1650 },
    { label: 'Fr', value: 2200 },
    { label: 'Sa', value: 2500 },
    { label: 'So', value: 2100 },
  ]
  const trafficFactor = amplifiedRatio(s.traffic, BASE_TRAFFIC, SENSITIVITY.traffic)
  const liftPower = 1 + ((s.uxLift - BASE_UX_LIFT) / 100) * SENSITIVITY.uxLift

  return base.map((point, index) => {
    const weeklyRamp = Math.pow(Math.max(0.35, liftPower), index / 3)
    return {
      label: point.label,
      value: Math.round(point.value * trafficFactor * weeklyRamp),
    }
  })
}

export function buildFunnelData(s: AnalyticsSettings) {
  const labels = ['Startseite', 'Produktseite', 'Warenkorb', 'Checkout', 'Erfolg']
  const base = [100, 65, 24, 8, BASE_FUNNEL_END]
  const endScale = amplifiedRatio(s.conversionRate, BASE_CONVERSION, SENSITIVITY.conversion)
  const uxBoost = 1 + (s.uxLift / 100) * 0.35

  let previous = 100

  return labels.map((label, index) => {
    if (index === 0) {
      return { label, value: 100 }
    }

    const raw = base[index] * endScale * uxBoost
    const capped = Math.min(raw, previous * 0.97, 100)
    const value = parseFloat(Math.max(0.5, capped).toFixed(1))
    previous = value
    return { label, value }
  })
}

export function buildSpeedData(s: AnalyticsSettings) {
  const base = [
    { label: '0.8s', value: 4.8 },
    { label: '1.2s', value: 4.2 },
    { label: '1.8s', value: 3.1 },
    { label: '2.5s', value: 2.1 },
    { label: '3.5s', value: 1.2 },
    { label: '4.8s', value: 0.6 },
  ]
  const crFactor = amplifiedRatio(s.conversionRate, BASE_CONVERSION, SENSITIVITY.conversion)
  const liftBoost = 1 + (s.uxLift / 100) * (SENSITIVITY.uxLift * 0.85)

  return base.map((point) => {
    const seconds = parseFloat(point.label)
    const speedBoost = seconds <= 2.2 ? liftBoost : 1 + (liftBoost - 1) * 0.35
    const trafficBoost = 1 + (s.traffic / BASE_TRAFFIC - 1) * 0.25
    return {
      label: point.label,
      value: parseFloat(
        Math.min(12, point.value * crFactor * speedBoost * trafficBoost).toFixed(1),
      ),
    }
  })
}

export function formatSettingsHint(s: AnalyticsSettings): string {
  return `${new Intl.NumberFormat('de-DE').format(s.traffic)} Besucher · ${s.conversionRate}% CR · +${s.uxLift}% UX-Lift`
}
