import { ADMIN_EMAIL, MONITOR_EMAIL } from './adminAuth'

export type DevLoginCredentials = {
  email: string
  password: string
}

/** @deprecated Use DevLoginCredentials */
export type DevAdminCredentials = DevLoginCredentials

/**
 * Dev-only credentials for local one-click login.
 * Production builds: always null (dead-code-eliminated behind import.meta.env.DEV).
 */
export function getDevAdminCredentials(): DevLoginCredentials | null {
  if (!import.meta.env.DEV) return null

  return {
    email: ADMIN_EMAIL,
    password: (import.meta.env.VITE_ADMIN_DEV_PASSWORD ?? '').trim(),
  }
}

/** Dev-only Monitor (Caro) credentials — never in production builds. */
export function getDevMonitorCredentials(): DevLoginCredentials | null {
  if (!import.meta.env.DEV) return null

  return {
    email: MONITOR_EMAIL,
    password: (import.meta.env.VITE_MONITOR_DEV_PASSWORD ?? '').trim(),
  }
}
