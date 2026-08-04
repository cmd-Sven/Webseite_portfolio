/** Normalisierte Admin-E-Mail aus Env (leer = nicht konfiguriert). */
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase()

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!ADMIN_EMAIL || !email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  )
}
