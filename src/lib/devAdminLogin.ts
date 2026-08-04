import { ADMIN_EMAIL } from './adminAuth'

export type DevAdminCredentials = {
  email: string
  password: string
}

/**
 * Dev-only credentials for local one-click login.
 * Production builds: always null (dead-code-eliminated behind import.meta.env.DEV).
 */
export function getDevAdminCredentials(): DevAdminCredentials | null {
  if (!import.meta.env.DEV) return null

  return {
    email: ADMIN_EMAIL,
    password: (import.meta.env.VITE_ADMIN_DEV_PASSWORD ?? '').trim(),
  }
}
