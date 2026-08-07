import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarPlus,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { CoverLetterBlockEditor } from '../../components/admin/CoverLetterBlockEditor'
import { CvDataEditor } from '../../components/admin/CvDataEditor'
import { ManualSentDialog } from '../../components/admin/ManualSentDialog'
import { useAuth } from '../../context/AuthContext'
import {
  computeAndPersistMatch,
  generateApplicationDocs,
  getApplicationAttachmentUrl,
  getApplicationById,
  getMasterProfile,
  listApplicationAttachments,
  removeApplicationAttachment,
  saveApplicationFeedback,
  updateApplication,
} from '../../lib/atsApi'
import { getJobPoolByApplicationId } from '../../lib/atsPoolApi'
import { openApplicationMailto } from '../../lib/atsMail'
import { downloadApplicationPdf, type PdfExportMode } from '../../lib/atsPdf'
import {
  joinCoverLetter,
  splitCoverLetter,
  type CoverLetterBlock,
} from '../../lib/coverLetterBlocks'
import { computeSkillMatch } from '../../lib/atsMatching'
import type {
  ApplicationAttachmentRow,
  ApplicationRow,
  ApplicationStatus,
  GeneratedCvData,
  JobPoolApplicationType,
  JobPoolRow,
  MatchBreakdown,
  MatchItem,
  SkillRequirement,
} from '../../types/ats'
import { APPLICATION_STATUSES, EMPTY_MASTER_PROFILE_CONTENT } from '../../types/ats'

const POOL_TYPE_LABEL: Record<JobPoolApplicationType, string> = {
  regular: 'Reguläre Stelle',
  initiative: 'Initiativ / Praktikum (WBS)',
}

function RequirementsList({ items }: { items: SkillRequirement[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-400">Keine Anforderungen erkannt.</p>
  }

  const hard = items.filter((i) => i.type === 'hard')
  const soft = items.filter((i) => i.type === 'soft')

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <h3 className="text-xs uppercase tracking-[0.14em] text-zinc-400 font-medium mb-2">
          Hard Skills
        </h3>
        <ul className="space-y-1.5">
          {hard.map((item) => (
            <li
              key={`hard-${item.skill}`}
              className="text-sm text-zinc-700 flex items-baseline gap-2"
            >
              <span className="truncate">{item.skill}</span>
              <span className="shrink-0 text-[11px] text-zinc-400">
                {item.priority === 'must' ? 'Pflicht' : 'Nice'}
              </span>
            </li>
          ))}
          {hard.length === 0 && <li className="text-sm text-zinc-400">—</li>}
        </ul>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-[0.14em] text-zinc-400 font-medium mb-2">
          Soft Skills
        </h3>
        <ul className="space-y-1.5">
          {soft.map((item) => (
            <li
              key={`soft-${item.skill}`}
              className="text-sm text-zinc-700 flex items-baseline gap-2"
            >
              <span className="truncate">{item.skill}</span>
              <span className="shrink-0 text-[11px] text-zinc-400">
                {item.priority === 'must' ? 'Pflicht' : 'Nice'}
              </span>
            </li>
          ))}
          {soft.length === 0 && <li className="text-sm text-zinc-400">—</li>}
        </ul>
      </div>
    </div>
  )
}

const STATUS_STYLE: Record<MatchItem['status'], string> = {
  matched: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  partial: 'bg-amber-50 text-amber-800 border-amber-200',
  missing: 'bg-red-50 text-red-800 border-red-200',
}

const STATUS_LABEL: Record<MatchItem['status'], string> = {
  matched: 'Vorhanden',
  partial: 'Teilweise',
  missing: 'Fehlend',
}

function MatchItemList({
  title,
  items,
  empty,
}: {
  title: string
  items: MatchItem[]
  empty: string
}) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-[0.14em] text-zinc-400 font-medium mb-2">
        {title} ({items.length})
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={`${item.status}-${item.skill}`}
              className={[
                'flex items-baseline justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm',
                STATUS_STYLE[item.status],
              ].join(' ')}
            >
              <span className="truncate">
                {item.skill}
                {item.matched_against && item.status !== 'missing' ? (
                  <span className="text-[11px] opacity-70 ml-1.5">
                    ↔ {item.matched_against}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-[11px] opacity-80">
                {item.priority === 'must' ? 'Pflicht' : 'Nice'} · {STATUS_LABEL[item.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function toneLabel(tone: number): string {
  if (tone <= 25) return 'Locker'
  if (tone <= 45) return 'Locker-professionell'
  if (tone <= 65) return 'Ausgewogen'
  if (tone <= 85) return 'Professionell'
  return 'Formell'
}

function syncEditorsFromApplication(app: ApplicationRow): {
  blocks: CoverLetterBlock[]
  cvDraft: GeneratedCvData
} {
  return {
    blocks: splitCoverLetter(app.generated_cover_letter ?? ''),
    cvDraft: app.generated_cv_data ?? {},
  }
}

export function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [application, setApplication] = useState<ApplicationRow | null>(null)
  const [breakdown, setBreakdown] = useState<MatchBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [profileEmpty, setProfileEmpty] = useState(false)

  const [tone, setTone] = useState(60)
  const [linkedPool, setLinkedPool] = useState<JobPoolRow | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genSuccess, setGenSuccess] = useState<string | null>(null)

  const [coverBlocks, setCoverBlocks] = useState<CoverLetterBlock[]>([])
  const [cvDraft, setCvDraft] = useState<GeneratedCvData>({})
  const [savingDocs, setSavingDocs] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [docsSuccess, setDocsSuccess] = useState<string | null>(null)
  const [exportingPdfMode, setExportingPdfMode] = useState<PdfExportMode | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [manualSentOpen, setManualSentOpen] = useState(false)
  const [attachments, setAttachments] = useState<ApplicationAttachmentRow[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<
    '' | 'Interview' | 'Absage' | 'Beworben'
  >('')
  const [savingFeedback, setSavingFeedback] = useState(false)

  async function refreshAttachments(applicationId: string) {
    setAttachmentsLoading(true)
    const { data, error: listError } = await listApplicationAttachments(applicationId)
    setAttachmentsLoading(false)
    if (listError) {
      setDocsError(listError)
      return
    }
    setAttachments(data)
  }

  useEffect(() => {
    if (!id) {
      setError('Keine Bewerbungs-ID')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setMatchError(null)

    void (async () => {
      const { data, error: fetchError } = await getApplicationById(id)
      if (cancelled) return

      if (fetchError) {
        setLoading(false)
        setError(fetchError)
        return
      }
      if (!data) {
        setLoading(false)
        setError('Bewerbung nicht gefunden.')
        return
      }

      const [{ data: profile }, { data: pool }] = await Promise.all([
        getMasterProfile(),
        getJobPoolByApplicationId(id),
      ])
      if (cancelled) return

      setLinkedPool(pool)

      const content = profile?.content ?? EMPTY_MASTER_PROFILE_CONTENT
      const hasSkills =
        content.skills.length > 0 ||
        content.hard_skills.length > 0 ||
        content.soft_skills.length > 0 ||
        content.projects.length > 0 ||
        content.stations.length > 0
      setProfileEmpty(!hasSkills)

      const { breakdown: nextBreakdown, application: nextApp, error: persistError } =
        await computeAndPersistMatch(data, content)

      if (cancelled) return
      setBreakdown(nextBreakdown)
      setApplication(nextApp)
      const synced = syncEditorsFromApplication(nextApp)
      setCoverBlocks(synced.blocks)
      setCvDraft(synced.cvDraft)
      setFeedbackNotes(nextApp.feedback_notes ?? '')
      if (persistError) setMatchError(persistError)
      setLoading(false)
      void refreshAttachments(nextApp.id)
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleRematch() {
    if (!application) return
    setMatchError(null)
    const { data: profile } = await getMasterProfile()
    const content = profile?.content ?? EMPTY_MASTER_PROFILE_CONTENT
    const { breakdown: nextBreakdown, application: nextApp, error: persistError } =
      await computeAndPersistMatch(application, content)
    setBreakdown(nextBreakdown)
    setApplication(nextApp)
    if (persistError) setMatchError(persistError)
  }

  async function handleGenerate() {
    if (!application) return
    setGenerating(true)
    setGenError(null)
    setGenSuccess(null)
    setDocsSuccess(null)

    const { data, error: genErr } = await generateApplicationDocs({
      application_id: application.id,
      tone,
      application_type: linkedPool?.application_type,
      pool: linkedPool
        ? {
            application_type: linkedPool.application_type,
            title: linkedPool.title,
            company_name: linkedPool.company_name,
            source_url: linkedPool.source_url,
            links: linkedPool.links,
            notes: linkedPool.notes,
            job_description: linkedPool.job_description,
            company_info: linkedPool.company_info,
            target_notes: linkedPool.target_notes,
            wbs_certificate_path: linkedPool.wbs_certificate_path,
          }
        : null,
    })

    setGenerating(false)

    if (genErr || !data) {
      setGenError(genErr || 'Generierung fehlgeschlagen')
      return
    }

    setApplication(data.application)
    const synced = syncEditorsFromApplication(data.application)
    setCoverBlocks(synced.blocks)
    setCvDraft(synced.cvDraft)

    if (data.application.parsed_requirements) {
      const { data: profile } = await getMasterProfile()
      setBreakdown(
        computeSkillMatch(
          data.application.parsed_requirements,
          profile?.content ?? EMPTY_MASTER_PROFILE_CONTENT,
        ),
      )
    }
    const typeLabel =
      data.meta?.application_type === 'initiative'
        ? 'Initiativ / Praktikum'
        : data.meta?.application_type === 'regular'
          ? 'reguläre Stelle'
          : linkedPool
            ? POOL_TYPE_LABEL[linkedPool.application_type]
            : 'reguläre Stelle'
    const fetched = data.meta?.fetched_urls ?? []
    const fetchedOk = fetched.filter((u) => u.ok).length
    const fetchHint =
      fetched.length > 0
        ? ` Links: ${fetchedOk}/${fetched.length} geladen.`
        : ''
    setGenSuccess(
      `Anschreiben und CV-Inhalt (${typeLabel}) wurden generiert und gespeichert.${fetchHint}`,
    )
  }

  async function handleSaveDocuments() {
    if (!application) return
    setSavingDocs(true)
    setDocsError(null)
    setDocsSuccess(null)

    const coverLetter = joinCoverLetter(coverBlocks)
    const { data, error: saveError } = await updateApplication(application.id, {
      generated_cover_letter: coverLetter,
      generated_cv_data: cvDraft,
    })

    setSavingDocs(false)

    if (saveError || !data) {
      setDocsError(saveError || 'Speichern fehlgeschlagen')
      return
    }

    setApplication(data)
    setDocsSuccess('Anschreiben und CV-Daten wurden gespeichert.')
  }

  async function handlePdfExport(mode: PdfExportMode = 'complete') {
    if (!application) return
    setExportingPdfMode(mode)
    setDocsError(null)

    const { error: pdfError } = await downloadApplicationPdf({
      company_name: application.company_name,
      job_title: application.job_title,
      cover_letter: joinCoverLetter(coverBlocks),
      cv_data: cvDraft,
      candidate_email: user?.email ?? undefined,
      candidate_name: user?.email?.split('@')[0],
      mode,
    })

    setExportingPdfMode(null)
    if (pdfError) {
      setDocsError(pdfError)
      return
    }
    const label =
      mode === 'cover_letter'
        ? 'Anschreiben-PDF'
        : mode === 'cv'
          ? 'Lebenslauf-PDF'
          : 'Komplett-PDF'
    setDocsSuccess(`${label} wurde heruntergeladen.`)
  }

  async function handleStatusChange(status: ApplicationStatus) {
    if (!application || status === application.status) return
    setStatusSaving(true)
    setDocsError(null)

    const patch =
      status === 'Beworben'
        ? { status, applied_at: new Date().toISOString() }
        : { status }

    const { data, error: statusError } = await updateApplication(application.id, patch)
    setStatusSaving(false)

    if (statusError || !data) {
      setDocsError(statusError || 'Status konnte nicht gespeichert werden')
      return
    }

    setApplication(data)
  }

  function handlePrepareEmail() {
    if (!application) return
    setDocsError(null)
    const { opened, error: mailError } = openApplicationMailto({
      companyName: application.company_name,
      jobTitle: application.job_title,
      coverLetter: joinCoverLetter(coverBlocks) || application.generated_cover_letter,
      candidateName: user?.email?.split('@')[0],
    })
    if (!opened || mailError) {
      setDocsError(mailError || 'Mail-Client konnte nicht geöffnet werden')
      return
    }
    setDocsSuccess(
      'Mail-Client geöffnet. PDF bitte manuell anhängen — mailto unterstützt keine Dateianhänge. Kein SMTP/Resend konfiguriert.',
    )
  }

  async function handleSaveFeedback() {
    if (!application) return
    setSavingFeedback(true)
    setDocsError(null)
    setDocsSuccess(null)

    const { data, error: feedbackError } = await saveApplicationFeedback(application.id, {
      feedback_notes: feedbackNotes,
      status: feedbackStatus || undefined,
    })
    setSavingFeedback(false)

    if (feedbackError || !data) {
      setDocsError(feedbackError || 'Rückmeldung konnte nicht gespeichert werden')
      return
    }

    setApplication(data)
    setFeedbackNotes(data.feedback_notes ?? '')
    setFeedbackStatus('')
    setDocsSuccess('Rückmeldung gespeichert.')
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        Lade Bewerbung …
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
        >
          {error || 'Bewerbung nicht gefunden.'}
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Zurück zum Kanban
        </Link>
      </div>
    )
  }

  const requirements = application.parsed_requirements ?? []
  const hasGeneratedDocs = Boolean(
    application.generated_cover_letter || application.generated_cv_data,
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Kanban
          </Link>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 truncate">
            {application.job_title}
          </h2>
          <p className="text-sm text-zinc-500">{application.company_name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {application.match_score != null && (
            <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 tabular-nums">
              Match {application.match_score}%
            </span>
          )}
          <label className="inline-flex items-center gap-2 text-xs text-zinc-500">
            Status
            <select
              value={application.status}
              disabled={statusSaving}
              onChange={(e) =>
                void handleStatusChange(e.target.value as ApplicationStatus)
              }
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-medium text-zinc-900">Manuell versendet</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Bewerbung wurde manuell verschickt — ohne KI-Dokumente. Optional Unterlagen
              hochladen. Speichert Versanddatum und lädt .ics (Absende + Follow-up nach 14
              Tagen).
            </p>
            {application.applied_at && (
              <p className="text-xs text-zinc-400">
                Versendet am{' '}
                {new Date(application.applied_at).toLocaleString('de-DE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                {application.sent_manually ? ' · manuell' : ''}
                {' · Follow-up '}
                {new Date(
                  new Date(application.applied_at).getTime() + 14 * 24 * 60 * 60 * 1000,
                ).toLocaleDateString('de-DE', { dateStyle: 'medium' })}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <button
              type="button"
              disabled={statusSaving || !user?.id}
              onClick={() => setManualSentOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3.5 py-2 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" aria-hidden />
              Manuell versendet
            </button>
            <button
              type="button"
              onClick={handlePrepareEmail}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-800 hover:bg-zinc-50 transition-colors"
              title="Öffnet mailto: — PDF manuell anhängen"
            >
              <Mail className="w-4 h-4" aria-hidden />
              Per E-Mail vorbereiten
            </button>
          </div>
        </div>

        <div className="space-y-2 border-t border-zinc-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
            <Paperclip className="w-3.5 h-3.5" aria-hidden />
            Hochgeladene Unterlagen
            {attachmentsLoading && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" aria-hidden />
            )}
          </div>
          {attachments.length === 0 ? (
            <p className="text-xs text-zinc-400">Noch keine Dateien — optional beim Markieren.</p>
          ) : (
            <ul className="space-y-1.5">
              {attachments.map((att) => (
                <li
                  key={att.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-700"
                >
                  <span className="truncate min-w-0">{att.file_name}</span>
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-zinc-600 hover:bg-white hover:text-zinc-900"
                      onClick={() => {
                        void (async () => {
                          const { url, error: urlError } = await getApplicationAttachmentUrl(
                            att.storage_path,
                          )
                          if (urlError || !url) {
                            setDocsError(urlError || 'Download-Link fehlgeschlagen')
                            return
                          }
                          window.open(url, '_blank', 'noopener,noreferrer')
                        })()
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                      Öffnen
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-red-600 hover:bg-white"
                      onClick={() => {
                        void (async () => {
                          const { error: delError } = await removeApplicationAttachment(att)
                          if (delError) {
                            setDocsError(delError)
                            return
                          }
                          setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                          setDocsSuccess(`„${att.file_name}“ entfernt.`)
                        })()
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden />
                      Löschen
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(docsError || docsSuccess) && (
          <div
            role={docsError ? 'alert' : 'status'}
            className={[
              'rounded-md border px-3 py-2 text-sm',
              docsError
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800',
            ].join(' ')}
          >
            {docsError || docsSuccess}
          </div>
        )}
      </section>

      {user?.id && (
        <ManualSentDialog
          open={manualSentOpen}
          application={application}
          userId={user.id}
          onClose={() => setManualSentOpen(false)}
          onError={(message) => {
            setDocsError(message)
            setDocsSuccess(null)
          }}
          onDone={({ application: next, filename, uploaded }) => {
            setApplication(next)
            void refreshAttachments(next.id)
            const parts = ['Als manuell versendet markiert']
            if (uploaded > 0) parts.push(`${uploaded} Datei(en) hochgeladen`)
            if (filename) parts.push(`.ics „${filename}“ (Absende + Follow-up +14 Tage)`)
            setDocsSuccess(parts.join(' — ') + '.')
            setDocsError(null)
          }}
        />
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-zinc-900">Rückmeldung eintragen</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Antwort per E-Mail hier notieren. Optional Status auf Interview oder Absage setzen.
          </p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-600">Notizen / Rückmeldung</span>
          <textarea
            rows={4}
            value={feedbackNotes}
            onChange={(e) => setFeedbackNotes(e.target.value)}
            disabled={savingFeedback}
            placeholder="z. B. Einladung zum Gespräch am … / Absage mit Begründung …"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-60 resize-y"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            Status setzen (optional)
            <select
              value={feedbackStatus}
              onChange={(e) =>
                setFeedbackStatus(e.target.value as '' | 'Interview' | 'Absage' | 'Beworben')
              }
              disabled={savingFeedback}
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-800 outline-none focus:border-zinc-500"
            >
              <option value="">Unverändert ({application.status})</option>
              <option value="Interview">Interview</option>
              <option value="Absage">Absage</option>
              <option value="Beworben">Beworben</option>
            </select>
          </label>
          <button
            type="button"
            disabled={savingFeedback || !feedbackNotes.trim()}
            onClick={() => void handleSaveFeedback()}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60 transition-colors"
          >
            {savingFeedback ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Save className="w-4 h-4" aria-hidden />
            )}
            Rückmeldung speichern
          </button>
        </div>
        {application.feedback_at && (
          <p className="text-xs text-zinc-400">
            Zuletzt erfasst{' '}
            {new Date(application.feedback_at).toLocaleString('de-DE', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-900">Skill-Matching</h3>
          <button
            type="button"
            onClick={() => void handleRematch()}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden />
            Neu berechnen
          </button>
        </div>

        {profileEmpty && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Master-Profil ist noch leer —{' '}
            <Link to="/admin/profile" className="underline underline-offset-2">
              Skills hinterlegen
            </Link>
            , damit Matching und Generierung sinnvoll werden.
          </p>
        )}

        {matchError && (
          <p role="alert" className="text-sm text-red-700">
            Score konnte nicht gespeichert werden: {matchError}
          </p>
        )}

        {breakdown && (
          <>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">
                {breakdown.score}
                <span className="text-lg font-medium text-zinc-400">%</span>
              </p>
              <p className="text-sm text-zinc-500 pb-1">
                {breakdown.matched.length} vorhanden · {breakdown.partial.length} teilweise ·{' '}
                {breakdown.missing.length} fehlend
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <MatchItemList
                title="Vorhanden"
                items={breakdown.matched}
                empty="Keine vollständigen Treffer."
              />
              <MatchItemList
                title="Teilweise"
                items={breakdown.partial}
                empty="Keine Teil-Treffer."
              />
              <MatchItemList
                title="Fehlend"
                items={breakdown.missing}
                empty="Keine Lücken — starkes Profil-Match."
              />
            </div>
          </>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-medium text-zinc-900">Dokumente generieren</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Anschreiben und CV auf Basis Master-Profil, aller Pool-Felder und verknüpfter
          Links (source_url / Unternehmensseiten werden best-effort mitgeladen). Tone steuert
          den Sprachstil.
        </p>

        {linkedPool ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 space-y-1">
            <p>
              Bewerbungstyp:{' '}
              <span className="font-medium text-zinc-900">
                {POOL_TYPE_LABEL[linkedPool.application_type]}
              </span>
              {linkedPool.application_type === 'initiative' &&
              linkedPool.wbs_certificate_path ? (
                <span className="text-zinc-500"> · WBS hinterlegt</span>
              ) : null}
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {linkedPool.application_type === 'initiative'
                ? 'Initiativ-Modus: Fokus auf company_info, Zielbereich und Mehrwert — kein Ausschreibungs-Ton. '
                : 'Regulärer Modus: Bezug zur Stellenanzeige und Anforderungen. '}
              Typ muss im Stellen-Pool stimmen. Hinterlegte Links (
              {(linkedPool.source_url ? 1 : 0) + (linkedPool.links?.length ?? 0)} URL
              {(linkedPool.source_url ? 1 : 0) + (linkedPool.links?.length ?? 0) === 1
                ? ''
                : 's'}
              ) werden serverseitig best-effort geladen.
            </p>
          </div>
        ) : (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-relaxed">
            Kein verknüpfter Pool-Eintrag — Generierung läuft als reguläre Stelle nur mit
            Application-Feldern. Für Initiativ/Praktikum bitte aus dem Stellen-Pool anlegen.
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Locker</span>
            <span className="font-medium text-zinc-700">{toneLabel(tone)}</span>
            <span>Professionell</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={tone}
            onChange={(e) => setTone(Number(e.target.value))}
            className="w-full accent-zinc-900"
            aria-label="Tone of Voice"
          />
        </div>

        <button
          type="button"
          disabled={generating}
          onClick={() => void handleGenerate()}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-60 transition-colors"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="w-4 h-4" aria-hidden />
          )}
          {application.generated_cover_letter ? 'Erneut generieren' : 'Anschreiben & CV generieren'}
        </button>

        {genError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
          >
            {genError}
          </div>
        )}
        {genSuccess && (
          <div
            role="status"
            className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800"
          >
            {genSuccess}
          </div>
        )}
      </section>

      {hasGeneratedDocs && (
        <>
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-zinc-900">Anschreiben – Review</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={savingDocs}
                  onClick={() => void handleSaveDocuments()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {savingDocs ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Save className="w-3.5 h-3.5" aria-hidden />
                  )}
                  Speichern
                </button>
                <button
                  type="button"
                  disabled={exportingPdfMode !== null}
                  onClick={() => void handlePdfExport('complete')}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {exportingPdfMode === 'complete' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Download className="w-3.5 h-3.5" aria-hidden />
                  )}
                  PDF komplett herunterladen
                </button>
                <button
                  type="button"
                  disabled={exportingPdfMode !== null}
                  onClick={() => void handlePdfExport('cover_letter')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {exportingPdfMode === 'cover_letter' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Download className="w-3.5 h-3.5" aria-hidden />
                  )}
                  Nur Anschreiben
                </button>
                <button
                  type="button"
                  disabled={exportingPdfMode !== null}
                  onClick={() => void handlePdfExport('cv')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  {exportingPdfMode === 'cv' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Download className="w-3.5 h-3.5" aria-hidden />
                  )}
                  Nur Lebenslauf
                </button>
              </div>
            </div>

            {(docsError || docsSuccess) && (
              <div
                role={docsError ? 'alert' : 'status'}
                className={[
                  'rounded-md border px-3 py-2 text-sm',
                  docsError
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800',
                ].join(' ')}
              >
                {docsError || docsSuccess}
              </div>
            )}

            <CoverLetterBlockEditor
              blocks={coverBlocks}
              onChange={setCoverBlocks}
              companyName={application.company_name}
              jobTitle={application.job_title}
            />
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-zinc-900">CV-Daten bearbeiten</h3>
              <button
                type="button"
                disabled={savingDocs}
                onClick={() => void handleSaveDocuments()}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
              >
                {savingDocs ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                ) : (
                  <Save className="w-3.5 h-3.5" aria-hidden />
                )}
                Speichern
              </button>
            </div>
            <CvDataEditor value={cvDraft} onChange={setCvDraft} />
          </section>
        </>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-medium text-zinc-900">Erkannte Anforderungen</h3>
        <RequirementsList items={requirements} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-medium text-zinc-900">Stellenanzeige (Rohtext)</h3>
        <pre className="whitespace-pre-wrap break-words text-sm text-zinc-600 leading-relaxed font-sans max-h-[420px] overflow-y-auto">
          {application.job_description_raw}
        </pre>
      </section>

      <p className="text-xs text-zinc-400">
        Erstellt am{' '}
        {new Date(application.created_at).toLocaleString('de-DE', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
      </p>
    </div>
  )
}
