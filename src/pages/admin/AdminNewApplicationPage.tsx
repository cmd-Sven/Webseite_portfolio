import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Inbox, Loader2, Sparkles } from 'lucide-react'
import { analyzeAndCreateApplication, createApplication } from '../../lib/atsApi'
import {
  getJobPoolEntry,
  linkApplicationToPool,
  listJobPool,
  updateJobPoolEntry,
} from '../../lib/atsPoolApi'
import { fillInitiativeFieldsFromJobText } from '../../lib/extractCompanyContextFromJobText'
import {
  JOB_POOL_STATUSES,
  type JobPoolApplicationType,
  type JobPoolRow,
  type JobPoolStatus,
} from '../../types/ats'

type StatusFilter = JobPoolStatus | 'offen' | 'Alle'

const STATUS_LABEL: Record<JobPoolStatus, string> = {
  gesammelt: 'Gesammelt',
  geplant: 'Geplant',
  in_arbeit: 'In Arbeit',
  erledigt: 'Erledigt',
}

const TYPE_LABEL: Record<JobPoolApplicationType, string> = {
  regular: 'Regulär',
  initiative: 'Initiativ',
}

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-60'

function linksToText(links: JobPoolRow['links']): string {
  return links
    .map((link) => (link.label ? `${link.label} | ${link.url}` : link.url))
    .join('\n')
}

function parseLinksText(text: string): JobPoolRow['links'] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf('|')
      if (sep >= 0) {
        const label = line.slice(0, sep).trim()
        const url = line.slice(sep + 1).trim()
        return url ? { url, ...(label ? { label } : {}) } : null
      }
      return { url: line }
    })
    .filter((item): item is JobPoolRow['links'][number] => item != null)
}

/**
 * Bei Initiativ: fehlende company_info / target_notes / Kontakt / Firmen-URL
 * best-effort aus job_description ableiten und optional am Pool speichern.
 */
async function enrichInitiativePoolEntry(entry: JobPoolRow): Promise<JobPoolRow> {
  const needsInfo = !entry.company_info?.trim()
  const needsTarget = !entry.target_notes?.trim()
  const needsContact =
    !entry.notes?.trim() ||
    (!/@/.test(entry.notes) && !/kontakt\s*:/i.test(entry.notes))
  const hasCompanyLink = entry.links.some((l) =>
    /unternehmen|website|karriere|firma/i.test(l.label ?? ''),
  )

  if (
    !entry.job_description?.trim() ||
    (!needsInfo && !needsTarget && !needsContact && hasCompanyLink)
  ) {
    return entry
  }

  const filled = fillInitiativeFieldsFromJobText(
    {
      company_info: entry.company_info ?? '',
      target_notes: entry.target_notes ?? '',
      notes: entry.notes ?? '',
      linksText: linksToText(entry.links),
      job_description: entry.job_description ?? '',
      title: entry.title ?? '',
      source_url: entry.source_url ?? '',
      company_name: entry.company_name,
    },
    { force: false },
  )

  if (filled.filledKeys.length === 0) return entry

  const patch = {
    company_info: filled.company_info.trim() || null,
    target_notes: filled.target_notes.trim() || null,
    notes: filled.notes.trim() || null,
    links: parseLinksText(filled.linksText),
  }

  const { data } = await updateJobPoolEntry(entry.id, patch)
  return data ?? { ...entry, ...patch }
}

function buildInitiativeRaw(entry: JobPoolRow): string {
  const parts = [
    entry.company_info?.trim(),
    entry.target_notes?.trim(),
    entry.notes?.trim(),
  ].filter((part): part is string => Boolean(part && part.length > 0))

  if (parts.length > 0) return parts.join('\n\n')
  return `Initiativbewerbung bei ${entry.company_name}`
}

function poolOptionLabel(entry: JobPoolRow): string {
  const title = entry.title?.trim() || TYPE_LABEL[entry.application_type]
  const status = STATUS_LABEL[entry.status]
  return `${entry.company_name} — ${title} (${status})`
}

export function AdminNewApplicationPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [poolEntries, setPoolEntries] = useState<JobPoolRow[]>([])
  const [poolLoading, setPoolLoading] = useState(true)
  const [poolError, setPoolError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('offen')
  const [selectedPoolId, setSelectedPoolId] = useState('')
  const [poolSubmitting, setPoolSubmitting] = useState(false)
  const [poolFormError, setPoolFormError] = useState<string | null>(null)

  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [pasteSubmitting, setPasteSubmitting] = useState(false)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const selectedPoolIdRef = useRef(selectedPoolId)
  selectedPoolIdRef.current = selectedPoolId

  const selectedEntry = useMemo(
    () => poolEntries.find((entry) => entry.id === selectedPoolId) ?? null,
    [poolEntries, selectedPoolId],
  )

  const loadPool = useCallback(async (preferId?: string) => {
    setPoolLoading(true)
    setPoolError(null)

    const filters =
      statusFilter === 'offen'
        ? {
            unlinkedOnly: true,
            statuses: ['gesammelt', 'geplant'] as JobPoolStatus[],
          }
        : statusFilter === 'Alle'
          ? { unlinkedOnly: true }
          : { unlinkedOnly: true, status: statusFilter }

    const { data, error } = await listJobPool(filters)
    if (error) {
      setPoolLoading(false)
      setPoolError(error)
      setPoolEntries([])
      return
    }

    let entries = data
    const preferredId = preferId || selectedPoolIdRef.current
    if (preferredId && !entries.some((entry) => entry.id === preferredId)) {
      const { data: one } = await getJobPoolEntry(preferredId)
      if (one && !one.application_id) {
        entries = [one, ...entries]
      }
    }

    setPoolEntries(entries)
    setPoolLoading(false)
  }, [statusFilter])

  useEffect(() => {
    void loadPool()
  }, [loadPool])

  // Prefill aus ?pool=… (z. B. Link vom Stellen-Pool)
  useEffect(() => {
    const poolParam = searchParams.get('pool')?.trim()
    if (!poolParam) return

    setSelectedPoolId(poolParam)
    void loadPool(poolParam)
    const next = new URLSearchParams(searchParams)
    next.delete('pool')
    setSearchParams(next, { replace: true })
    // Nur Query einmalig konsumieren
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreateFromPool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPoolFormError(null)

    if (!selectedEntry) {
      setPoolFormError('Bitte eine Stelle aus dem Pool auswählen.')
      return
    }

    if (selectedEntry.application_id) {
      setPoolFormError('Dieser Eintrag ist bereits mit einer Bewerbung verknüpft.')
      return
    }

    setPoolSubmitting(true)

    let applicationId: string | null = null
    let createError: string | null = null

    if (selectedEntry.application_type === 'regular') {
      const jd = selectedEntry.job_description?.trim() ?? ''
      if (jd.length < 40) {
        setPoolSubmitting(false)
        setPoolFormError(
          'Stellenbeschreibung im Pool-Eintrag ist zu kurz. Bitte im Stellen-Pool ergänzen (mind. ca. 40 Zeichen).',
        )
        return
      }

      const { data, error } = await analyzeAndCreateApplication({
        job_description_raw: jd,
        company_name: selectedEntry.company_name,
        source_url: selectedEntry.source_url || undefined,
      })
      createError = error
      applicationId = data?.application?.id ?? null
    } else {
      const enriched = await enrichInitiativePoolEntry(selectedEntry)
      const raw = buildInitiativeRaw(enriched)
      const { data, error } = await createApplication({
        company_name: enriched.company_name,
        job_title: enriched.title?.trim() || 'Initiativbewerbung',
        job_description_raw: raw,
        status: 'Gefunden',
        parsed_requirements: [],
      })
      createError = error
      applicationId = data?.id ?? null
    }

    if (createError || !applicationId) {
      setPoolSubmitting(false)
      setPoolFormError(createError || 'Bewerbung konnte nicht angelegt werden.')
      return
    }

    const { error: linkError } = await linkApplicationToPool(
      selectedEntry.id,
      applicationId,
      'in_arbeit',
    )
    setPoolSubmitting(false)

    if (linkError) {
      // Bewerbung existiert bereits – trotzdem zur Detailseite, mit Hinweis
      setPoolFormError(
        `Bewerbung angelegt, aber Pool-Verknüpfung fehlgeschlagen: ${linkError}`,
      )
      navigate(`/admin/applications/${applicationId}`, { replace: true })
      return
    }

    navigate(`/admin/applications/${applicationId}`, { replace: true })
  }

  async function handlePasteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasteError(null)

    const raw = jobDescription.trim()
    if (raw.length < 40) {
      setPasteError('Bitte füge den vollständigen Stellenanzeigen-Text ein (mind. ca. 40 Zeichen).')
      return
    }

    setPasteSubmitting(true)
    const { data, error: analyzeError } = await analyzeAndCreateApplication({
      job_description_raw: raw,
      company_name: companyName.trim() || undefined,
      source_url: sourceUrl.trim() || undefined,
    })
    setPasteSubmitting(false)

    if (analyzeError || !data?.application?.id) {
      setPasteError(analyzeError || 'Analyse fehlgeschlagen.')
      return
    }

    navigate(`/admin/applications/${data.application.id}`, { replace: true })
  }

  const createButtonLabel =
    selectedEntry?.application_type === 'initiative'
      ? 'Bewerbung erstellen'
      : 'Analysieren & anlegen'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Neue Bewerbung erfassen
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Stelle aus dem Pool wählen und daraus eine Bewerbung anlegen. Rohtext-Paste bleibt als
          Fallback.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleCreateFromPool(e)}
        className="rounded-lg border border-zinc-200 bg-white p-5 md:p-6 space-y-5 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-zinc-100 p-2 text-zinc-700">
            <Inbox className="w-4 h-4" aria-hidden />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900">Aus dem Stellen-Pool</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Nur Einträge ohne verknüpfte Bewerbung. Reguläre Stellen werden analysiert;
              Initiativbewerbungen werden direkt angelegt.
            </p>
          </div>
        </div>

        {poolFormError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
          >
            {poolFormError}
          </div>
        )}

        {poolError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
          >
            {poolError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Status-Filter</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              disabled={poolLoading || poolSubmitting}
              className={inputClass}
            >
              <option value="offen">Offen (gesammelt / geplant)</option>
              {JOB_POOL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
              <option value="Alle">Alle ohne Bewerbung</option>
            </select>
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">Stelle auswählen</span>
            <select
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              disabled={poolLoading || poolSubmitting || poolEntries.length === 0}
              required
              className={inputClass}
            >
              <option value="">
                {poolLoading
                  ? 'Lade Pool …'
                  : poolEntries.length === 0
                    ? 'Keine passenden Einträge'
                    : 'Bitte wählen …'}
              </option>
              {poolEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {poolOptionLabel(entry)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedEntry && (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-700">
              <span>
                <span className="text-zinc-500">Typ:</span> {TYPE_LABEL[selectedEntry.application_type]}
              </span>
              <span>
                <span className="text-zinc-500">Status:</span> {STATUS_LABEL[selectedEntry.status]}
              </span>
              {selectedEntry.source_url && (
                <a
                  href={selectedEntry.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
                >
                  Quelle öffnen
                </a>
              )}
            </div>
            {selectedEntry.application_type === 'regular' ? (
              <p className="text-zinc-500 line-clamp-4 whitespace-pre-wrap">
                {selectedEntry.job_description?.trim() || 'Keine Stellenbeschreibung hinterlegt.'}
              </p>
            ) : (
              <p className="text-zinc-500 line-clamp-4 whitespace-pre-wrap">
                {buildInitiativeRaw(selectedEntry)}
              </p>
            )}
            <p className="text-xs text-zinc-400">
              Fehlt Text?{' '}
              <Link to="/admin/pool" className="underline underline-offset-2 hover:text-zinc-700">
                Im Stellen-Pool bearbeiten
              </Link>
            </p>
          </div>
        )}

        {!poolLoading && poolEntries.length === 0 && (
          <p className="text-sm text-zinc-500">
            Keine offenen Pool-Einträge.{' '}
            <Link to="/admin/pool" className="underline underline-offset-2 hover:text-zinc-800">
              Zum Stellen-Pool
            </Link>
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={poolSubmitting || poolLoading || !selectedPoolId}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {poolSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Wird angelegt …
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden />
                {createButtonLabel}
              </>
            )}
          </button>
          <Link
            to="/admin"
            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors text-center sm:text-left"
          >
            Abbrechen · zum Kanban
          </Link>
        </div>
      </form>

      <details className="rounded-lg border border-zinc-200 bg-white shadow-sm group">
        <summary className="cursor-pointer list-none px-5 py-4 md:px-6 text-sm font-medium text-zinc-800 flex items-center justify-between gap-3">
          <span>Fallback: Stellenanzeige als Rohtext einfügen</span>
          <span className="text-xs font-normal text-zinc-400 group-open:hidden">Aufklappen</span>
        </summary>
        <form
          onSubmit={(e) => void handlePasteSubmit(e)}
          className="border-t border-zinc-200 px-5 py-5 md:px-6 space-y-5"
        >
          <p className="text-sm text-zinc-500 leading-relaxed">
            Nur wenn die Stelle nicht im Pool liegt. Analyse legt eine Bewerbung mit Status
            „Gefunden“ an — ohne Pool-Verknüpfung.
          </p>

          {pasteError && (
            <div
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
            >
              {pasteError}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">
              Stellenanzeige <span className="text-zinc-400 font-normal">(Rohtext)</span>
            </span>
            <textarea
              required
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Gesamten Text der Stellenanzeige hier einfügen …"
              disabled={pasteSubmitting}
              className={`${inputClass} leading-relaxed resize-y min-h-[180px] py-2.5`}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">
                Unternehmensname <span className="text-zinc-400 font-normal">(optional)</span>
              </span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Falls bekannt"
                disabled={pasteSubmitting}
                className={inputClass}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">
                Link / URL <span className="text-zinc-400 font-normal">(optional)</span>
              </span>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://…"
                disabled={pasteSubmitting}
                className={inputClass}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={pasteSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pasteSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Wird analysiert …
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden />
                Stellenanzeige analysieren
              </>
            )}
          </button>
        </form>
      </details>
    </div>
  )
}
