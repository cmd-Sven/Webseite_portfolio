import { supabase } from './supabaseClient'
import type { User } from '@supabase/supabase-js'

/** Erste Admin-User-ID für Monitor-Inserts in Svens Stellen-Pool. */
export async function resolveAdminPoolOwnerId(): Promise<{
  userId: string | null
  error: string | null
}> {
  const { data, error } = await supabase.rpc('ats_admin_user_ids')
  if (error) return { userId: null, error: error.message }

  const ids = normalizeUuidList(data)
  if (ids.length === 0) {
    return {
      userId: null,
      error: 'Kein Admin-Konto gefunden — bitte Sven benachrichtigen.',
    }
  }
  return { userId: ids[0] ?? null, error: null }
}

function normalizeUuidList(data: unknown): string[] {
  if (!Array.isArray(data)) return []
  const out: string[] = []
  for (const item of data) {
    if (typeof item === 'string' && item.trim()) {
      out.push(item.trim())
      continue
    }
    if (item && typeof item === 'object') {
      const values = Object.values(item as Record<string, unknown>)
      for (const v of values) {
        if (typeof v === 'string' && v.trim()) {
          out.push(v.trim())
          break
        }
      }
    }
  }
  return out
}

export type MonitorProfileUpdate = {
  displayName?: string
  email?: string
  password?: string
}

/** Nur eigene Auth-Daten (Monitor/Admin-Account). */
export async function updateMonitorAccount(
  patch: MonitorProfileUpdate,
): Promise<{ user: User | null; error: string | null; emailChangePending: boolean }> {
  const data: {
    email?: string
    password?: string
    data?: { display_name?: string; full_name?: string }
  } = {}

  const email = patch.email?.trim().toLowerCase()
  if (email) data.email = email

  const password = patch.password ?? ''
  if (password) {
    if (password.length < 8) {
      return {
        user: null,
        error: 'Passwort muss mindestens 8 Zeichen haben.',
        emailChangePending: false,
      }
    }
    data.password = password
  }

  if (typeof patch.displayName === 'string') {
    const name = patch.displayName.trim()
    data.data = {
      display_name: name,
      full_name: name,
    }
  }

  if (!data.email && !data.password && !data.data) {
    return {
      user: null,
      error: 'Keine Änderungen zum Speichern.',
      emailChangePending: false,
    }
  }

  const { data: result, error } = await supabase.auth.updateUser(data)
  if (error) {
    return { user: null, error: error.message, emailChangePending: false }
  }

  const newEmail =
    typeof result.user?.new_email === 'string' ? result.user.new_email : null
  const emailChangePending = Boolean(
    email &&
      (newEmail ||
        (result.user?.email && result.user.email.toLowerCase() !== email)),
  )

  return {
    user: result.user,
    error: null,
    emailChangePending,
  }
}

export function displayNameFromUser(user: User | null | undefined): string {
  if (!user) return ''
  const meta = user.user_metadata ?? {}
  const fromMeta =
    (typeof meta.display_name === 'string' && meta.display_name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    ''
  return fromMeta.trim()
}
