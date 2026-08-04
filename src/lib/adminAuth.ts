/** Rollen & Auth-Helfer für Personal ATS (Admin + Monitor). */

export type AppRole = 'admin' | 'monitor'

/** Normalisierte Admin-E-Mail aus Env (leer = nicht konfiguriert). */
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase()

/** Monitor-E-Mail (Caro); Fallback wenn Env fehlt. */
export const MONITOR_EMAIL = (
  import.meta.env.VITE_MONITOR_EMAIL ?? 'caro@sven-sieber.de'
).trim().toLowerCase()

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!ADMIN_EMAIL || !email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL
}

export function isMonitorEmail(email: string | undefined | null): boolean {
  if (!MONITOR_EMAIL || !email) return false
  return email.trim().toLowerCase() === MONITOR_EMAIL
}

/** Rolle aus app_metadata (sicher) oder E-Mail-Fallback. */
export function resolveAppRole(user: {
  email?: string | null
  app_metadata?: Record<string, unknown> | null
} | null | undefined): AppRole | null {
  if (!user) return null

  const raw = user.app_metadata?.role
  if (typeof raw === 'string') {
    const role = raw.trim().toLowerCase()
    if (role === 'admin' || role === 'monitor') return role
  }

  if (isAdminEmail(user.email)) return 'admin'
  if (isMonitorEmail(user.email)) return 'monitor'
  return null
}

export function isAllowedAtsUser(email: string | undefined | null): boolean {
  return isAdminEmail(email) || isMonitorEmail(email)
}

export function homePathForRole(role: AppRole | null): string {
  if (role === 'monitor') return '/monitor'
  if (role === 'admin') return '/admin'
  return '/admin/login'
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  )
}
