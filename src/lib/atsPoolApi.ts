import { supabase } from './supabaseClient'
import {
  ATS_DOCUMENTS_STORAGE_BUCKET,
  atsWbsCertificatePath,
  type JobPoolApplicationType,
  type JobPoolLink,
  type JobPoolRow,
  type JobPoolStatus,
} from '../types/ats'

function normalizeLinks(raw: unknown): JobPoolLink[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const url = typeof (item as { url?: unknown }).url === 'string'
        ? (item as { url: string }).url.trim()
        : ''
      if (!url) return null
      const label =
        typeof (item as { label?: unknown }).label === 'string'
          ? (item as { label: string }).label.trim()
          : undefined
      return { url, ...(label ? { label } : {}) } satisfies JobPoolLink
    })
    .filter((item): item is JobPoolLink => item != null)
}

function mapJobPoolRow(row: JobPoolRow): JobPoolRow {
  return {
    ...row,
    links: normalizeLinks(row.links),
  }
}

export type JobPoolInsert = {
  user_id: string
  application_type: JobPoolApplicationType
  title?: string | null
  company_name: string
  status?: JobPoolStatus
  source_url?: string | null
  links?: JobPoolLink[]
  notes?: string | null
  job_description?: string | null
  company_info?: string | null
  target_notes?: string | null
  wbs_certificate_path?: string | null
  application_id?: string | null
}

export type JobPoolUpdatePatch = Partial<
  Pick<
    JobPoolRow,
    | 'application_type'
    | 'title'
    | 'company_name'
    | 'status'
    | 'source_url'
    | 'links'
    | 'notes'
    | 'job_description'
    | 'company_info'
    | 'target_notes'
    | 'wbs_certificate_path'
    | 'application_id'
  >
>

export type JobPoolListFilters = {
  status?: JobPoolStatus | 'Alle'
  /** Mehrere Statuswerte (z. B. gesammelt + geplant). Hat Vorrang vor `status`. */
  statuses?: JobPoolStatus[]
  application_type?: JobPoolApplicationType | 'Alle'
  /** Nur Einträge ohne verknüpfte Bewerbung. */
  unlinkedOnly?: boolean
}

export async function listJobPoolEntries(
  filters: JobPoolListFilters = {},
): Promise<{ data: JobPoolRow[]; error: string | null }> {
  let query = supabase
    .from('job_pool')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses)
  } else if (filters.status && filters.status !== 'Alle') {
    query = query.eq('status', filters.status)
  }
  if (filters.application_type && filters.application_type !== 'Alle') {
    query = query.eq('application_type', filters.application_type)
  }
  if (filters.unlinkedOnly) {
    query = query.is('application_id', null)
  }

  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return {
    data: ((data as JobPoolRow[]) ?? []).map(mapJobPoolRow),
    error: null,
  }
}

/** Alias für `listJobPoolEntries`. */
export const listJobPool = listJobPoolEntries

/**
 * Verknüpft eine Bewerbung mit einem Pool-Eintrag und setzt den Pool-Status
 * (Standard: in_arbeit).
 */
export async function linkApplicationToPool(
  poolId: string,
  applicationId: string,
  status: JobPoolStatus = 'in_arbeit',
): Promise<{ data: JobPoolRow | null; error: string | null }> {
  return updateJobPoolEntry(poolId, {
    application_id: applicationId,
    status,
  })
}

export async function getJobPoolEntry(
  id: string,
): Promise<{ data: JobPoolRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('job_pool')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }
  return { data: mapJobPoolRow(data as JobPoolRow), error: null }
}

/** Pool-Eintrag zu einer Bewerbung (falls verknüpft). */
export async function getJobPoolByApplicationId(
  applicationId: string,
): Promise<{ data: JobPoolRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('job_pool')
    .select('*')
    .eq('application_id', applicationId)
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }
  return { data: mapJobPoolRow(data as JobPoolRow), error: null }
}

export async function createJobPoolEntry(
  input: JobPoolInsert,
): Promise<{ data: JobPoolRow | null; error: string | null }> {
  const payload = {
    user_id: input.user_id,
    application_type: input.application_type,
    title: input.title?.trim() || null,
    company_name: input.company_name.trim(),
    status: input.status ?? 'gesammelt',
    source_url: input.source_url?.trim() || null,
    links: input.links ?? [],
    notes: input.notes?.trim() || null,
    job_description: input.job_description?.trim() || null,
    company_info: input.company_info?.trim() || null,
    target_notes: input.target_notes?.trim() || null,
    wbs_certificate_path: input.wbs_certificate_path ?? null,
    application_id: input.application_id ?? null,
  }

  const { data, error } = await supabase
    .from('job_pool')
    .insert(payload)
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapJobPoolRow(data as JobPoolRow), error: null }
}

export async function updateJobPoolEntry(
  id: string,
  patch: JobPoolUpdatePatch,
): Promise<{ data: JobPoolRow | null; error: string | null }> {
  const payload: JobPoolUpdatePatch = { ...patch }
  if (typeof payload.title === 'string') {
    payload.title = payload.title.trim() || null
  }
  if (typeof payload.company_name === 'string') {
    payload.company_name = payload.company_name.trim()
  }
  if (typeof payload.source_url === 'string') {
    payload.source_url = payload.source_url.trim() || null
  }
  if (typeof payload.notes === 'string') {
    payload.notes = payload.notes.trim() || null
  }
  if (typeof payload.job_description === 'string') {
    payload.job_description = payload.job_description.trim() || null
  }
  if (typeof payload.company_info === 'string') {
    payload.company_info = payload.company_info.trim() || null
  }
  if (typeof payload.target_notes === 'string') {
    payload.target_notes = payload.target_notes.trim() || null
  }

  const { data, error } = await supabase
    .from('job_pool')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Eintrag nicht gefunden' }
  return { data: mapJobPoolRow(data as JobPoolRow), error: null }
}

export async function deleteJobPoolEntry(
  id: string,
): Promise<{ error: string | null }> {
  const { data: existing, error: loadError } = await getJobPoolEntry(id)
  if (loadError) return { error: loadError }

  if (existing?.wbs_certificate_path) {
    await removeWbsCertificate(existing.wbs_certificate_path)
  }

  const { error } = await supabase.from('job_pool').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

/** PDF-Upload in ats-documents; upsert braucht INSERT+SELECT+UPDATE (Policies vorhanden). */
export async function uploadWbsCertificate(
  userId: string,
  jobPoolId: string,
  file: File,
): Promise<{ path: string | null; error: string | null }> {
  if (file.type && file.type !== 'application/pdf') {
    return { path: null, error: 'Nur PDF-Dateien sind erlaubt' }
  }
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    return { path: null, error: 'Nur PDF-Dateien sind erlaubt' }
  }

  const path = atsWbsCertificatePath(userId, jobPoolId)
  const { error } = await supabase.storage
    .from(ATS_DOCUMENTS_STORAGE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: 'application/pdf',
      cacheControl: '3600',
    })

  if (error) return { path: null, error: error.message }
  return { path, error: null }
}

export async function removeWbsCertificate(
  path: string,
): Promise<{ error: string | null }> {
  if (!path.trim()) return { error: null }
  const { error } = await supabase.storage
    .from(ATS_DOCUMENTS_STORAGE_BUCKET)
    .remove([path])
  if (error) return { error: error.message }
  return { error: null }
}

/** Signierte URL für private WBS-PDFs (1 h). */
export async function getWbsCertificateUrl(
  path: string | null | undefined,
): Promise<{ url: string | null; error: string | null }> {
  if (!path?.trim()) return { url: null, error: null }

  const { data, error } = await supabase.storage
    .from(ATS_DOCUMENTS_STORAGE_BUCKET)
    .createSignedUrl(path, 60 * 60)

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl, error: null }
}

/**
 * Lädt WBS hoch und speichert den Pfad am Pool-Eintrag.
 * Ersetzt vorhandene Datei (gleicher Pfad, upsert).
 */
export async function uploadAndAttachWbsCertificate(
  userId: string,
  jobPoolId: string,
  file: File,
): Promise<{ data: JobPoolRow | null; error: string | null }> {
  const { path, error: uploadError } = await uploadWbsCertificate(userId, jobPoolId, file)
  if (uploadError || !path) {
    return { data: null, error: uploadError || 'Upload fehlgeschlagen' }
  }

  return updateJobPoolEntry(jobPoolId, { wbs_certificate_path: path })
}

export async function clearWbsCertificate(
  jobPoolId: string,
  path: string | null | undefined,
): Promise<{ data: JobPoolRow | null; error: string | null }> {
  if (path) {
    const { error: removeError } = await removeWbsCertificate(path)
    if (removeError) return { data: null, error: removeError }
  }
  return updateJobPoolEntry(jobPoolId, { wbs_certificate_path: null })
}
