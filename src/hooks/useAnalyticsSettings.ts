import { useSyncExternalStore } from 'react'
import {
  getAnalyticsSettings,
  subscribeAnalyticsSettings,
  type AnalyticsSettings,
} from '../lib/analyticsSettingsStore'

export function useAnalyticsSettings(): AnalyticsSettings {
  return useSyncExternalStore(subscribeAnalyticsSettings, getAnalyticsSettings, getAnalyticsSettings)
}
