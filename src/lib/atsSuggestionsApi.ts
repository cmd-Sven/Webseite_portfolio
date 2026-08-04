import { supabase } from './supabaseClient'
import type {
  CompanySuggestionRow,
  CompanySuggestionStatus,
  JobSuggestionRow,
  JobSuggestionStatus,
} from '../types/ats'

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  return trimmed ? trimmed : null
}

export type JobSuggestionInsert = {
  title: string
  company_name: string
  source_url?: string | null
  notes?: string | null
  job_description_raw?: string | null
}

export type CompanySuggestionInsert = {
  company_name: string
  company_url: string
  notes?: string | null
}

export async function createJobSuggestion(
  input: JobSuggestionInsert,
): Promise<{ data: JobSuggestionRow | null; error: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: userError?.message || 'Nicht authentifiziert' }
  }

  const title = input.title.trim()
  const companyName = input.company_name.trim()
  if (!title) return { data: null, error: 'Titel fehlt' }
  if (!companyName) return { data: null, error: 'Firma fehlt' }

  const { data, error } = await supabase
    .from('job_suggestions')
    .insert({
      suggested_by: user.id,
      title,
      company_name: companyName,
      source_url: normalizeOptional(input.source_url),
      notes: normalizeOptional(input.notes),
      job_description_raw: normalizeOptional(input.job_description_raw),
      status: 'neu',
    })
    .select('*')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as JobSuggestionRow | null, error: null }
}

export async function listJobSuggestions(): Promise<{
  data: JobSuggestionRow[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('job_suggestions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data as JobSuggestionRow[]) ?? [], error: null }
}

export async function updateJobSuggestionStatus(
  id: string,
  status: JobSuggestionStatus,
  jobPoolId?: string | null,
): Promise<{ data: JobSuggestionRow | null; error: string | null }> {
  const patch: Record<string, unknown> = { status }
  if (jobPoolId !== undefined) patch.job_pool_id = jobPoolId

  const { data, error } = await supabase
    .from('job_suggestions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as JobSuggestionRow | null, error: null }
}

export async function createCompanySuggestion(
  input: CompanySuggestionInsert,
): Promise<{ data: CompanySuggestionRow | null; error: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: userError?.message || 'Nicht authentifiziert' }
  }

  const companyName = input.company_name.trim()
  let companyUrl = input.company_url.trim()
  if (!companyName) return { data: null, error: 'Unternehmensname fehlt' }
  if (!companyUrl) return { data: null, error: 'Unternehmens-Link fehlt' }

  if (!/^https?:\/\//i.test(companyUrl)) {
    companyUrl = `https://${companyUrl}`
  }

  const { data, error } = await supabase
    .from('company_suggestions')
    .insert({
      suggested_by: user.id,
      company_name: companyName,
      company_url: companyUrl,
      notes: normalizeOptional(input.notes),
      status: 'neu',
    })
    .select('*')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as CompanySuggestionRow | null, error: null }
}

export async function listCompanySuggestions(): Promise<{
  data: CompanySuggestionRow[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('company_suggestions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data as CompanySuggestionRow[]) ?? [], error: null }
}

export async function updateCompanySuggestionStatus(
  id: string,
  status: CompanySuggestionStatus,
): Promise<{ data: CompanySuggestionRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('company_suggestions')
    .update({ status })
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as CompanySuggestionRow | null, error: null }
}
