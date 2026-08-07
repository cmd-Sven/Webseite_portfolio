import { supabase } from './supabaseClient'
import { downloadApplicationIcal } from './atsIcal'
import { computeSkillMatch, normalizeMasterProfileContent, syncDerivedSkillLists } from './atsMatching'
import { findPlanSlotByPoolId, markPlanSlotDone } from './atsPlanApi'
import { updateJobPoolEntry } from './atsPoolApi'
import type {
  AnalyzeJobPostingRequest,
  AnalyzeJobPostingResponse,
  ApplicationAttachmentRow,
  ApplicationRow,
  ApplicationStatus,
  GenerateApplicationDocsRequest,
  GenerateApplicationDocsResponse,
  JobPoolRow,
  MasterProfileAssetKind,
  MasterProfileContent,
  MasterProfileRow,
  MatchBreakdown,
  RewriteCoverBlockRequest,
  RewriteCoverBlockResponse,
} from '../types/ats'
import {
  ATS_DOCUMENTS_STORAGE_BUCKET,
  EMPTY_MASTER_PROFILE_CONTENT,
  MASTER_PROFILE_STORAGE_BUCKET,
  PORTFOLIO_PUBLIC_CV_OBJECT,
  PORTFOLIO_PUBLIC_STORAGE_BUCKET,
  atsApplicationAttachmentPath,
} from '../types/ats'
import { linkApplicationToPool } from './atsPoolApi'

async function invokeErrorMessage(error: {
  message?: string
  context?: Response
}): Promise<string> {
  let message = error.message || 'Anfrage fehlgeschlagen'
  const ctx = error.context
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = (await ctx.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // ignore
    }
  }
  return message
}

export async function analyzeAndCreateApplication(
  payload: AnalyzeJobPostingRequest,
): Promise<{ data: AnalyzeJobPostingResponse | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<AnalyzeJobPostingResponse>(
    'analyze-job-posting',
    { body: payload },
  )

  if (error) {
    return { data: null, error: await invokeErrorMessage(error) }
  }

  if (!data?.application?.id) {
    return { data: null, error: 'Unerwartete Antwort der Analyse-Funktion' }
  }

  return { data, error: null }
}

export type CreateApplicationInput = {
  company_name: string
  job_title: string
  job_description_raw: string
  status?: ApplicationStatus
  parsed_requirements?: ApplicationRow['parsed_requirements']
}

/** Legt eine Bewerbung direkt an (ohne KI-Analyse), z. B. Initiativ aus dem Pool. */
export async function createApplication(
  input: CreateApplicationInput,
): Promise<{ data: ApplicationRow | null; error: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: userError?.message || 'Nicht authentifiziert' }
  }

  const companyName = input.company_name.trim()
  const jobTitle = input.job_title.trim()
  const raw = input.job_description_raw.trim()

  if (!companyName) {
    return { data: null, error: 'Unternehmensname fehlt' }
  }
  if (!jobTitle) {
    return { data: null, error: 'Stellenbezeichnung fehlt' }
  }
  if (!raw) {
    return { data: null, error: 'Beschreibungstext fehlt' }
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      company_name: companyName,
      job_title: jobTitle,
      job_description_raw: raw,
      status: input.status ?? 'Gefunden',
      parsed_requirements: input.parsed_requirements ?? [],
    })
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: normalizeApplicationRow(data as ApplicationRow), error: null }
}

export async function generateApplicationDocs(
  payload: GenerateApplicationDocsRequest,
): Promise<{ data: GenerateApplicationDocsResponse | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<GenerateApplicationDocsResponse>(
    'generate-application-docs',
    { body: payload },
  )

  if (error) {
    return { data: null, error: await invokeErrorMessage(error) }
  }

  if (!data?.application?.id) {
    return { data: null, error: 'Unerwartete Antwort der Generierungs-Funktion' }
  }

  return { data, error: null }
}

export async function rewriteCoverBlock(
  payload: RewriteCoverBlockRequest,
): Promise<{ data: RewriteCoverBlockResponse | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<RewriteCoverBlockResponse>(
    'rewrite-cover-block',
    { body: payload },
  )

  if (error) {
    return { data: null, error: await invokeErrorMessage(error) }
  }

  if (!data?.rewritten) {
    return { data: null, error: 'Unerwartete Antwort der Rewrite-Funktion' }
  }

  return { data, error: null }
}

export async function getApplicationById(
  id: string,
): Promise<{ data: ApplicationRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }
  return { data: normalizeApplicationRow(data as ApplicationRow), error: null }
}

function normalizeApplicationRow(row: ApplicationRow): ApplicationRow {
  return {
    ...row,
    feedback_notes: row.feedback_notes ?? null,
    feedback_at: row.feedback_at ?? null,
    applied_at: row.applied_at ?? null,
    sent_manually: Boolean(row.sent_manually),
  }
}

export async function listApplications(): Promise<{
  data: ApplicationRow[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return {
    data: ((data as ApplicationRow[]) ?? []).map(normalizeApplicationRow),
    error: null,
  }
}

export type ApplicationUpdatePatch = Partial<
  Pick<
    ApplicationRow,
    | 'status'
    | 'applied_at'
    | 'sent_manually'
    | 'feedback_notes'
    | 'feedback_at'
    | 'match_score'
    | 'generated_cover_letter'
    | 'generated_cv_data'
    | 'company_name'
    | 'job_title'
  >
>

export async function updateApplication(
  id: string,
  patch: ApplicationUpdatePatch,
): Promise<{ data: ApplicationRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('applications')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return {
    data: data ? normalizeApplicationRow(data as ApplicationRow) : null,
    error: null,
  }
}

/**
 * Setzt verknüpften Pool auf „erledigt“ und zugehörigen Plan-Slot auf „erledigt“.
 */
async function syncPoolAndSlotAfterApplied(applicationId: string): Promise<void> {
  const { data: poolRows } = await supabase
    .from('job_pool')
    .select('id')
    .eq('application_id', applicationId)
    .limit(1)

  const poolId = (poolRows as { id: string }[] | null)?.[0]?.id
  if (!poolId) return

  await updateJobPoolEntry(poolId, { status: 'erledigt' })
  const { data: slot } = await findPlanSlotByPoolId(poolId)
  if (slot && slot.status !== 'erledigt') {
    await markPlanSlotDone(slot.id)
  }
}

/**
 * Setzt Status auf „Beworben“, aktualisiert applied_at und lädt die .ics-Datei herunter
 * (Absende + Follow-up nach 14 Tagen). Synchronisiert Pool/Plan-Slot falls verknüpft.
 * Unabhängig von KI-generierten Dokumenten.
 */
export async function markAppliedAndDownloadCalendar(
  application: ApplicationRow,
  options?: {
    /** ISO-Zeitstempel oder YYYY-MM-DD — Default: jetzt */
    appliedAt?: string
    /** Markiert als manuell versendet */
    sentManually?: boolean
    /** .ics-Download überspringen */
    skipCalendarDownload?: boolean
  },
): Promise<{ data: ApplicationRow | null; filename: string | null; error: string | null }> {
  const appliedAt = resolveAppliedAtIso(options?.appliedAt)
  const patch: ApplicationUpdatePatch = {
    status: 'Beworben' satisfies ApplicationStatus,
    applied_at: appliedAt,
  }
  if (options?.sentManually) {
    patch.sent_manually = true
  }

  const { data, error } = await updateApplication(application.id, patch)
  if (error || !data) {
    return { data: null, filename: null, error: error || 'Status konnte nicht gespeichert werden' }
  }

  await syncPoolAndSlotAfterApplied(data.id)

  if (options?.skipCalendarDownload) {
    return { data, filename: null, error: null }
  }

  const { filename, error: icalError } = downloadApplicationIcal({
    id: data.id,
    company_name: data.company_name,
    job_title: data.job_title,
    applied_at: data.applied_at ?? appliedAt,
  })

  if (icalError) {
    return { data, filename: null, error: icalError }
  }

  return { data, filename, error: null }
}

/** YYYY-MM-DD oder ISO → ISO; ungültig → jetzt. */
function resolveAppliedAtIso(value?: string): string {
  if (!value?.trim()) return new Date().toISOString()
  const raw = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const local = new Date(`${raw}T12:00:00`)
    if (!Number.isNaN(local.getTime())) return local.toISOString()
  }
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return new Date().toISOString()
}

const ATTACHMENT_ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
])

function guessMimeFromName(fileName: string): string | null {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'doc') return 'application/msword'
  if (ext === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'txt') return 'text/plain'
  return null
}

export async function listApplicationAttachments(
  applicationId: string,
): Promise<{ data: ApplicationAttachmentRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('application_attachments')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data as ApplicationAttachmentRow[]) ?? [], error: null }
}

export async function uploadApplicationAttachment(
  userId: string,
  applicationId: string,
  file: File,
  label?: string | null,
): Promise<{ data: ApplicationAttachmentRow | null; error: string | null }> {
  const mime = file.type || guessMimeFromName(file.name) || 'application/octet-stream'
  if (file.type && !ATTACHMENT_ALLOWED_MIME.has(file.type)) {
    const guessed = guessMimeFromName(file.name)
    if (!guessed || !ATTACHMENT_ALLOWED_MIME.has(guessed)) {
      return {
        data: null,
        error: 'Dateityp nicht erlaubt (PDF, DOC/DOCX, JPG/PNG/WebP, TXT)',
      }
    }
  }

  const path = atsApplicationAttachmentPath(userId, applicationId, file.name)
  const contentType = ATTACHMENT_ALLOWED_MIME.has(mime)
    ? mime
    : guessMimeFromName(file.name) || 'application/pdf'

  const { error: uploadError } = await supabase.storage
    .from(ATS_DOCUMENTS_STORAGE_BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType,
      cacheControl: '3600',
    })

  if (uploadError) return { data: null, error: uploadError.message }

  const { data, error } = await supabase
    .from('application_attachments')
    .insert({
      application_id: applicationId,
      user_id: userId,
      storage_path: path,
      file_name: file.name,
      mime_type: contentType,
      label: label?.trim() || null,
    })
    .select('*')
    .single()

  if (error) {
    await supabase.storage.from(ATS_DOCUMENTS_STORAGE_BUCKET).remove([path])
    return { data: null, error: error.message }
  }

  return { data: data as ApplicationAttachmentRow, error: null }
}

export async function removeApplicationAttachment(
  attachment: ApplicationAttachmentRow,
): Promise<{ error: string | null }> {
  const { error: storageError } = await supabase.storage
    .from(ATS_DOCUMENTS_STORAGE_BUCKET)
    .remove([attachment.storage_path])

  const { error } = await supabase
    .from('application_attachments')
    .delete()
    .eq('id', attachment.id)

  if (error) return { error: error.message }
  if (storageError) return { error: storageError.message }
  return { error: null }
}

export async function getApplicationAttachmentUrl(
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
 * Manuell versendet: Status Beworben + applied_at + optional Uploads + .ics Follow-up.
 * Keine KI-Dokumente nötig.
 */
export async function markManuallySent(
  application: ApplicationRow,
  input: {
    userId: string
    /** YYYY-MM-DD oder ISO — Default heute */
    sentAt?: string
    files?: File[]
  },
): Promise<{
  data: ApplicationRow | null
  filename: string | null
  uploaded: number
  error: string | null
}> {
  const files = input.files ?? []
  let uploaded = 0

  for (const file of files) {
    const { error: uploadError } = await uploadApplicationAttachment(
      input.userId,
      application.id,
      file,
    )
    if (uploadError) {
      return {
        data: null,
        filename: null,
        uploaded,
        error: `Upload „${file.name}“ fehlgeschlagen: ${uploadError}`,
      }
    }
    uploaded += 1
  }

  const { data, filename, error } = await markAppliedAndDownloadCalendar(application, {
    appliedAt: input.sentAt,
    sentManually: true,
  })

  return { data, filename, uploaded, error }
}

/**
 * Stellt sicher, dass ein Pool-Eintrag eine Bewerbung hat (ohne KI).
 * Legt ggf. eine Minimal-Bewerbung an und verknüpft sie.
 */
export async function ensureApplicationForPool(
  pool: JobPoolRow,
): Promise<{ data: ApplicationRow | null; error: string | null }> {
  if (pool.application_id) {
    return getApplicationById(pool.application_id)
  }

  const jobTitle =
    pool.title?.trim() ||
    (pool.application_type === 'initiative' ? 'Initiativbewerbung' : 'Stelle')
  const description =
    pool.job_description?.trim() ||
    pool.company_info?.trim() ||
    pool.target_notes?.trim() ||
    pool.notes?.trim() ||
    pool.source_url?.trim() ||
    `Manuell versendet: ${pool.company_name}`

  const { data: created, error: createError } = await createApplication({
    company_name: pool.company_name,
    job_title: jobTitle,
    job_description_raw: description,
    status: 'In Bearbeitung',
  })

  if (createError || !created) {
    return { data: null, error: createError || 'Bewerbung konnte nicht angelegt werden' }
  }

  const { error: linkError } = await linkApplicationToPool(pool.id, created.id, 'in_arbeit')
  if (linkError) {
    return { data: created, error: `Bewerbung angelegt, Pool-Verknüpfung fehlgeschlagen: ${linkError}` }
  }

  return { data: created, error: null }
}

/** Speichert Rückmeldung und optional Status (Interview / Absage). */
export async function saveApplicationFeedback(
  applicationId: string,
  input: {
    feedback_notes: string
    status?: Extract<ApplicationStatus, 'Interview' | 'Absage' | 'Beworben'>
  },
): Promise<{ data: ApplicationRow | null; error: string | null }> {
  const notes = input.feedback_notes.trim()
  if (!notes) {
    return { data: null, error: 'Bitte eine Rückmeldung eintragen' }
  }

  const patch: ApplicationUpdatePatch = {
    feedback_notes: notes,
    feedback_at: new Date().toISOString(),
  }
  if (input.status) {
    patch.status = input.status
  }

  return updateApplication(applicationId, patch)
}

export async function getMasterProfile(): Promise<{
  data: MasterProfileRow | null
  error: string | null
}> {
  const { data, error } = await supabase.from('master_profile').select('*').maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }

  const row = data as MasterProfileRow
  return {
    data: {
      ...row,
      content: normalizeMasterProfileContent(row.content),
    },
    error: null,
  }
}

export async function saveMasterProfile(
  content: MasterProfileContent,
  userId: string,
): Promise<{ data: MasterProfileRow | null; error: string | null }> {
  const normalized = syncDerivedSkillLists(normalizeMasterProfileContent(content))

  const { data, error } = await supabase
    .from('master_profile')
    .upsert(
      {
        user_id: userId,
        content: normalized,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single()

  if (error) return { data: null, error: error.message }

  const row = data as MasterProfileRow
  return {
    data: {
      ...row,
      content: normalizeMasterProfileContent(row.content),
    },
    error: null,
  }
}

const ASSET_FILE_NAMES: Record<MasterProfileAssetKind, string> = {
  cv_pdf: 'cv.pdf',
  photo: 'photo',
  signature: 'signature',
}

function extensionForFile(file: File, kind: MasterProfileAssetKind): string {
  if (kind === 'cv_pdf') return 'pdf'
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

/** Spiegelt den Master-CV in den öffentlichen Portfolio-Bucket (Landingpage-Download). */
async function mirrorCvToPortfolioPublic(
  file: File | Blob,
): Promise<{ error: string | null }> {
  const { error } = await supabase.storage
    .from(PORTFOLIO_PUBLIC_STORAGE_BUCKET)
    .upload(PORTFOLIO_PUBLIC_CV_OBJECT, file, {
      upsert: true,
      contentType: 'application/pdf',
      cacheControl: '300',
    })
  if (error) return { error: error.message }
  return { error: null }
}

async function removeMirroredPortfolioCv(): Promise<{ error: string | null }> {
  const { error } = await supabase.storage
    .from(PORTFOLIO_PUBLIC_STORAGE_BUCKET)
    .remove([PORTFOLIO_PUBLIC_CV_OBJECT])
  if (error) return { error: error.message }
  return { error: null }
}

export async function uploadMasterProfileAsset(
  userId: string,
  kind: MasterProfileAssetKind,
  file: File,
): Promise<{ path: string | null; error: string | null }> {
  const ext = extensionForFile(file, kind)
  const base = ASSET_FILE_NAMES[kind]
  const path = `${userId}/${kind === 'cv_pdf' ? base : `${base}.${ext}`}`

  const { error } = await supabase.storage
    .from(MASTER_PROFILE_STORAGE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: '3600',
    })

  if (error) return { path: null, error: error.message }

  if (kind === 'cv_pdf') {
    const mirrored = await mirrorCvToPortfolioPublic(file)
    if (mirrored.error) {
      return {
        path,
        error: `Privat gespeichert, öffentlicher Spiegel fehlgeschlagen: ${mirrored.error}`,
      }
    }
  }

  return { path, error: null }
}

export async function removeMasterProfileAsset(
  path: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(MASTER_PROFILE_STORAGE_BUCKET).remove([path])
  if (error) return { error: error.message }

  const isCv = path.endsWith('/cv.pdf') || path === 'cv.pdf'
  if (isCv) {
    const mirrored = await removeMirroredPortfolioCv()
    if (mirrored.error) {
      return { error: `Privat entfernt, öffentlicher Spiegel fehlgeschlagen: ${mirrored.error}` }
    }
  }

  return { error: null }
}

/** Signierte URL für private Assets (1 h). */
export async function getMasterProfileAssetUrl(
  path: string | null | undefined,
): Promise<{ url: string | null; error: string | null }> {
  if (!path?.trim()) return { url: null, error: null }

  const { data, error } = await supabase.storage
    .from(MASTER_PROFILE_STORAGE_BUCKET)
    .createSignedUrl(path, 60 * 60)

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl, error: null }
}

/**
 * Berechnet Match-Score aus Anforderungen + Master-Profil und speichert ihn in applications.
 */
export async function computeAndPersistMatch(
  application: ApplicationRow,
  profileContent?: MasterProfileContent | null,
): Promise<{
  breakdown: MatchBreakdown
  application: ApplicationRow
  error: string | null
}> {
  let content = profileContent
  if (content === undefined) {
    const { data: profile, error: profileError } = await getMasterProfile()
    if (profileError) {
      const breakdown = computeSkillMatch(
        application.parsed_requirements,
        EMPTY_MASTER_PROFILE_CONTENT,
      )
      return { breakdown, application, error: profileError }
    }
    content = profile?.content ?? EMPTY_MASTER_PROFILE_CONTENT
  }

  const breakdown = computeSkillMatch(application.parsed_requirements, content)

  if (application.match_score === breakdown.score) {
    return { breakdown, application, error: null }
  }

  const { data: updated, error } = await updateApplication(application.id, {
    match_score: breakdown.score,
  })

  return {
    breakdown,
    application: updated ?? { ...application, match_score: breakdown.score },
    error,
  }
}
