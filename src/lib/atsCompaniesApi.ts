import { supabase } from './supabaseClient'
import type {
  CompanyEventRow,
  CompanyEventType,
  InterestingCompanyRow,
  InterestingCompanyWithBadges,
} from '../types/ats'

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  return trimmed ? trimmed : null
}

export function normalizeCompanyNameClient(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function listInterestingCompanies(): Promise<{
  data: InterestingCompanyRow[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('interesting_companies')
    .select('*')
    .order('last_contact_at', { ascending: false, nullsFirst: false })

  if (error) return { data: [], error: error.message }
  return { data: (data as InterestingCompanyRow[]) ?? [], error: null }
}

export async function listCompanyEvents(
  companyId: string,
): Promise<{ data: CompanyEventRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('company_events')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data as CompanyEventRow[]) ?? [], error: null }
}

export async function createInterestingCompany(input: {
  user_id: string
  name: string
  website_url?: string | null
  notes?: string | null
}): Promise<{ data: InterestingCompanyRow | null; error: string | null }> {
  const name = input.name.trim()
  if (!name) return { data: null, error: 'Name fehlt' }

  let websiteUrl = normalizeOptional(input.website_url)
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    websiteUrl = `https://${websiteUrl}`
  }

  const { data, error } = await supabase
    .from('interesting_companies')
    .insert({
      user_id: input.user_id,
      name,
      website_url: websiteUrl,
      normalized_name: normalizeCompanyNameClient(name),
      notes: normalizeOptional(input.notes),
      last_contact_at: new Date().toISOString(),
    })
    .select('*')
    .maybeSingle()

  if (error) {
    if (error.message.toLowerCase().includes('duplicate') || error.code === '23505') {
      return { data: null, error: 'Unternehmen existiert bereits im Verzeichnis.' }
    }
    return { data: null, error: error.message }
  }

  if (data?.id) {
    await supabase.from('company_events').insert({
      company_id: data.id,
      event_type: 'created_manual' satisfies CompanyEventType,
      payload: { source: 'admin_ui' },
      note: normalizeOptional(input.notes),
      created_by: input.user_id,
    })
  }

  return { data: data as InterestingCompanyRow | null, error: null }
}

export async function updateInterestingCompany(
  id: string,
  patch: Partial<Pick<InterestingCompanyRow, 'name' | 'website_url' | 'notes'>>,
): Promise<{ data: InterestingCompanyRow | null; error: string | null }> {
  const payload: Record<string, unknown> = {}
  if (patch.name !== undefined) {
    payload.name = patch.name.trim()
    payload.normalized_name = normalizeCompanyNameClient(patch.name)
  }
  if (patch.website_url !== undefined) {
    let url = normalizeOptional(patch.website_url)
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`
    payload.website_url = url
  }
  if (patch.notes !== undefined) {
    payload.notes = normalizeOptional(patch.notes)
  }

  const { data, error } = await supabase
    .from('interesting_companies')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as InterestingCompanyRow | null, error: null }
}

/** Badges aus Pool-/Bewerbungsdaten + Events berechnen. */
export async function listInterestingCompaniesWithBadges(): Promise<{
  data: InterestingCompanyWithBadges[]
  error: string | null
}> {
  const [companiesRes, poolRes, appsRes, eventsRes] = await Promise.all([
    supabase
      .from('interesting_companies')
      .select('*')
      .order('last_contact_at', { ascending: false, nullsFirst: false }),
    supabase.from('job_pool').select('id, company_name, status'),
    supabase
      .from('applications')
      .select('id, company_name, status, applied_at, feedback_notes'),
    supabase.from('company_events').select('company_id, event_type'),
  ])

  if (companiesRes.error) {
    return { data: [], error: companiesRes.error.message }
  }

  const companies = (companiesRes.data as InterestingCompanyRow[]) ?? []
  const pool = poolRes.data ?? []
  const apps = appsRes.data ?? []
  const events = eventsRes.data ?? []

  const suggestedIds = new Set(
    events
      .filter((e) => e.event_type === 'suggested')
      .map((e) => e.company_id as string),
  )
  const feedbackIds = new Set(
    events
      .filter((e) => e.event_type === 'feedback' || e.event_type === 'interview' || e.event_type === 'rejection')
      .map((e) => e.company_id as string),
  )

  const data: InterestingCompanyWithBadges[] = companies.map((c) => {
    const norm = c.normalized_name
    const poolFor = pool.filter(
      (p) => normalizeCompanyNameClient(p.company_name || '') === norm,
    )
    const appsFor = apps.filter(
      (a) => normalizeCompanyNameClient(a.company_name || '') === norm,
    )

    const isActive = poolFor.some((p) =>
      ['gesammelt', 'geplant', 'in_arbeit'].includes(p.status),
    ) || appsFor.some((a) => ['Gefunden', 'In Bearbeitung'].includes(a.status))

    const appliedBefore = appsFor.some(
      (a) =>
        ['Beworben', 'Interview', 'Absage'].includes(a.status) ||
        Boolean(a.applied_at),
    )

    const hasFeedback =
      feedbackIds.has(c.id) ||
      appsFor.some((a) => Boolean((a.feedback_notes || '').trim()))

    return {
      ...c,
      badges: {
        active: isActive,
        appliedBefore,
        fromSuggestion: suggestedIds.has(c.id),
        hasFeedback,
      },
    }
  })

  return { data, error: null }
}

export const COMPANY_EVENT_LABELS: Record<CompanyEventType, string> = {
  created_manual: 'Manuell angelegt',
  suggested: 'Vorschlag (Monitor)',
  pool_collected: 'Stelle gesammelt',
  pool_planned: 'Stelle geplant',
  pool_in_progress: 'Stelle in Arbeit',
  pool_done: 'Stelle erledigt',
  application_created: 'Bewerbung erstellt',
  application_sent: 'Bewerbung verschickt',
  feedback: 'Rückmeldung',
  interview: 'Interview',
  rejection: 'Absage',
  note: 'Notiz',
}
