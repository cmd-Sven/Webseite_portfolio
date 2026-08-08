import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createJobPoolEntry } from '../../lib/atsPoolApi'
import {
  COMPANY_EVENT_LABELS,
  listCompanyEvents,
  listInterestingCompaniesWithBadges,
  startCompanyApplicationFlow,
  upsertInterestingCompanyFromImport,
} from '../../lib/atsCompaniesApi'
import {
  ATS_COMPANY_BOOKMARKLET_EVENT,
  buildCompanyBookmarkletHref,
  claimCompanyBookmarkletPayload,
  consumeCompanyBookmarkletHash,
  loadCompanyBookmarkletPayload,
  readCompanyBookmarkletFromClipboard,
  resolveCompanyImportFields,
  saveCompanyBookmarkletPayload,
  type AtsCompanyBookmarkletPayload,
} from '../../lib/atsCompanyBookmarklet'
import { guessCompanyFromUrl } from '../../lib/atsPoolBookmarklet'
import { todayLocalDateString } from '../../lib/atsPlanApi'
import {
  listCompanySuggestions,
  listJobSuggestions,
  updateCompanySuggestionStatus,
  updateJobSuggestionStatus,
} from '../../lib/atsSuggestionsApi'
import type {
  CompanyEventRow,
  CompanySuggestionRow,
  CompanySuggestionStatus,
  InterestingCompanyWithBadges,
  JobPoolApplicationType,
  JobSuggestionRow,
} from '../../types/ats'

type MainTab = 'directory' | 'job_suggestions'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function BadgeIcon({
  title,
  active,
  children,
}: {
  title: string
  active: boolean
  children: ReactNode
}) {
  if (!active) return null
  return (
    <span
      title={title}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-700"
    >
      {children}
      <span className="sr-only">{title}</span>
    </span>
  )
}

function SourceChip({ fromSuggestion }: { fromSuggestion: boolean }) {
  if (fromSuggestion) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-900">
        <Sparkles className="w-3 h-3" aria-hidden />
        Monitor-Vorschlag
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-900">
      Interessantes Unternehmen
    </span>
  )
}

export function AdminCompaniesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<MainTab>('directory')
  const [companies, setCompanies] = useState<InterestingCompanyWithBadges[]>([])
  const [jobs, setJobs] = useState<JobSuggestionRow[]>([])
  const [pendingCompanies, setPendingCompanies] = useState<CompanySuggestionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [selected, setSelected] = useState<InterestingCompanyWithBadges | null>(null)
  const [events, setEvents] = useState<CompanyEventRow[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addUrl, setAddUrl] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addSource, setAddSource] = useState<'admin_ui' | 'bookmarklet'>('admin_ui')

  const [bookmarkletHref, setBookmarkletHref] = useState('')
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false)
  const [bookmarkletHint, setBookmarkletHint] = useState(false)
  const [importMissBanner, setImportMissBanner] = useState(false)
  const bookmarkletLinkRef = useRef<HTMLAnchorElement>(null)
  const importLockRef = useRef(false)
  const importReceivedRef = useRef(false)

  const [planType, setPlanType] = useState<JobPoolApplicationType>('initiative')
  const [planTitle, setPlanTitle] = useState('')
  const [planNotes, setPlanNotes] = useState('')
  const [planDate, setPlanDate] = useState(todayLocalDateString())
  const [planAlsoApply, setPlanAlsoApply] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [dirRes, jobRes, companySugRes] = await Promise.all([
      listInterestingCompaniesWithBadges(),
      listJobSuggestions(),
      listCompanySuggestions(),
    ])
    if (dirRes.error || jobRes.error || companySugRes.error) {
      setError(dirRes.error || jobRes.error || companySugRes.error)
      setLoading(false)
      return
    }
    setCompanies(dirRes.data)
    setJobs(jobRes.data)
    setPendingCompanies(companySugRes.data.filter((c) => c.status === 'neu'))
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    setBookmarkletHref(buildCompanyBookmarkletHref(window.location.origin, '/admin/companies'))
  }, [])

  useEffect(() => {
    const el = bookmarkletLinkRef.current
    if (!el || !bookmarkletHref) return
    el.setAttribute('href', bookmarkletHref)
  }, [bookmarkletHref])

  useEffect(() => {
    if (!selected) {
      setEvents([])
      return
    }
    let active = true
    setEventsLoading(true)
    setPlanType('initiative')
    setPlanTitle('')
    setPlanNotes('')
    setPlanDate(todayLocalDateString())
    setPlanAlsoApply(false)
    void listCompanyEvents(selected.id).then((res) => {
      if (!active) return
      setEvents(res.data)
      setEventsLoading(false)
    })
    return () => {
      active = false
    }
  }, [selected])

  const applyBookmarkletPayload = useCallback((payload: AtsCompanyBookmarkletPayload) => {
    if (!claimCompanyBookmarkletPayload(payload)) return
    importReceivedRef.current = true
    setImportMissBanner(false)
    const fields = resolveCompanyImportFields(payload)
    setAddName(fields.name)
    setAddUrl(fields.website_url)
    setAddNotes(fields.notes)
    setAddSource('bookmarklet')
    setShowAdd(true)
    setTab('directory')
    setNotice(
      'Bookmarklet-Daten vorausgefüllt — Name/URL prüfen und als interessantes Unternehmen speichern.',
    )
  }, [])

  useEffect(() => {
    if (!user) return

    const fromBookmarklet = searchParams.get('from') === 'bookmarklet'
    const wantClipboard = searchParams.get('import') === 'clipboard'
    let cancelled = false
    let missTimer: number | undefined

    function clearImportQuery() {
      const next = new URLSearchParams(searchParams)
      let changed = false
      if (next.has('from')) {
        next.delete('from')
        changed = true
      }
      if (next.has('import')) {
        next.delete('import')
        changed = true
      }
      if (changed) setSearchParams(next, { replace: true })
    }

    async function ingestAvailable() {
      const stored = loadCompanyBookmarkletPayload()
      if (stored) {
        applyBookmarkletPayload(stored)
        return true
      }

      const fromHash = consumeCompanyBookmarkletHash()
      if (fromHash) {
        saveCompanyBookmarkletPayload(fromHash)
        applyBookmarkletPayload(fromHash)
        return true
      }

      if (wantClipboard) {
        const fromClip = await readCompanyBookmarkletFromClipboard()
        if (fromClip) {
          saveCompanyBookmarkletPayload(fromClip)
          applyBookmarkletPayload(fromClip)
          return true
        }
      }

      return false
    }

    void ingestAvailable().then((got) => {
      if (cancelled) return
      if (got || fromBookmarklet || wantClipboard) clearImportQuery()

      if ((fromBookmarklet || wantClipboard) && !importReceivedRef.current) {
        missTimer = window.setTimeout(() => {
          if (cancelled || importReceivedRef.current) return
          const late = loadCompanyBookmarkletPayload()
          if (late) {
            applyBookmarkletPayload(late)
            return
          }
          setImportMissBanner(true)
        }, 4500)
      }
    })

    function onCompanyBookmarkletEvent(event: Event) {
      const detail = (event as CustomEvent<AtsCompanyBookmarkletPayload>).detail
      if (!detail) return
      applyBookmarkletPayload(detail)
    }

    window.addEventListener(ATS_COMPANY_BOOKMARKLET_EVENT, onCompanyBookmarkletEvent)
    return () => {
      cancelled = true
      if (missTimer) window.clearTimeout(missTimer)
      window.removeEventListener(ATS_COMPANY_BOOKMARKLET_EVENT, onCompanyBookmarkletEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, applyBookmarkletPayload])

  const openJobs = useMemo(() => jobs.filter((j) => j.status === 'neu'), [jobs])

  function prefillFromUrl() {
    const raw = addUrl.trim()
    if (!raw) return
    let url = raw
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    setAddUrl(url)
    if (!addName.trim()) {
      const guessed = guessCompanyFromUrl(url)
      if (guessed) setAddName(guessed)
    }
  }

  async function handleAddCompany(e: FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    if (importLockRef.current) return
    importLockRef.current = true
    setBusyId('add')
    setNotice(null)
    const { data, created, error: err } = await upsertInterestingCompanyFromImport({
      user_id: user.id,
      name: addName,
      website_url: addUrl,
      notes: addNotes,
      source: addSource,
    })
    setBusyId(null)
    importLockRef.current = false
    if (err || !data) {
      setNotice(err || 'Speichern fehlgeschlagen')
      return
    }
    setAddName('')
    setAddUrl('')
    setAddNotes('')
    setAddSource('admin_ui')
    setShowAdd(false)
    setNotice(
      created
        ? `„${data.name}“ als interessantes Unternehmen angelegt.`
        : `„${data.name}“ war schon im Verzeichnis — Daten aktualisiert.`,
    )
    await reload()
    const refreshed = (await listInterestingCompaniesWithBadges()).data.find((c) => c.id === data.id)
    if (refreshed) setSelected(refreshed)
  }

  async function handleClipboardImport() {
    setError(null)
    setImportMissBanner(false)
    const fromClip = await readCompanyBookmarkletFromClipboard()
    if (!fromClip) {
      setNotice(
        'Keine Firmen-Bookmarklet-Daten in der Zwischenablage. Bookmarklet auf einer Unternehmensseite ausführen oder URL manuell eintragen.',
      )
      return
    }
    saveCompanyBookmarkletPayload(fromClip)
    applyBookmarkletPayload(fromClip)
  }

  async function copyBookmarkletCode() {
    if (!bookmarkletHref) {
      setError('Bookmarklet-Code noch nicht bereit — Seite kurz neu laden.')
      return
    }
    try {
      await navigator.clipboard.writeText(bookmarkletHref)
      setBookmarkletCopied(true)
      setBookmarkletHint(false)
      window.setTimeout(() => setBookmarkletCopied(false), 2500)
    } catch {
      setError(
        'Clipboard blockiert. Unten den Code manuell markieren und kopieren, dann als Lesezeichen-URL einfügen.',
      )
    }
  }

  async function runCompanyFlow(mode: 'plan' | 'apply' | 'plan_and_apply') {
    if (!user?.id || !selected) return
    setBusyId(`flow-${selected.id}`)
    setNotice(null)
    const markApplied = mode === 'apply' || mode === 'plan_and_apply' || planAlsoApply
    const doPlan = mode === 'plan' || mode === 'plan_and_apply'
    const { data, error: err } = await startCompanyApplicationFlow({
      userId: user.id,
      company: selected,
      applicationType: planType,
      title: planTitle || null,
      extraNotes: planNotes || null,
      planFromDate: doPlan ? planDate || todayLocalDateString() : null,
      markApplied,
    })
    setBusyId(null)
    if (err) {
      setNotice(err)
      return
    }
    const parts: string[] = []
    if (data?.pool) {
      parts.push(
        planType === 'initiative'
          ? 'Initiativ-Eintrag im Pool'
          : 'Stellen-Eintrag im Pool',
      )
    }
    if (data?.planned) parts.push('geplant')
    if (data?.markedApplied) parts.push('als beworben markiert')
    setNotice(`${selected.name}: ${parts.join(' · ') || 'erledigt'}.`)
    await reload()
  }

  async function adoptJob(suggestion: JobSuggestionRow) {
    if (!user?.id) return
    setBusyId(suggestion.id)
    setNotice(null)
    const { data: pool, error: poolError } = await createJobPoolEntry({
      user_id: user.id,
      application_type: 'regular',
      title: suggestion.title,
      company_name: suggestion.company_name,
      status: 'gesammelt',
      source_url: suggestion.source_url,
      notes: suggestion.notes,
      job_description: suggestion.job_description_raw,
    })
    if (poolError || !pool) {
      setBusyId(null)
      setNotice(poolError || 'Übernahme fehlgeschlagen')
      return
    }
    await updateJobSuggestionStatus(suggestion.id, 'uebernommen', pool.id)
    setBusyId(null)
    setNotice(`„${suggestion.title}“ in den Stellen-Pool übernommen.`)
    await reload()
  }

  async function rejectJob(id: string) {
    setBusyId(id)
    await updateJobSuggestionStatus(id, 'abgelehnt')
    setBusyId(null)
    await reload()
  }

  async function setCompanySugStatus(id: string, status: CompanySuggestionStatus) {
    setBusyId(id)
    await updateCompanySuggestionStatus(id, status)
    setBusyId(null)
    await reload()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-medium">
            Verzeichnis
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Interessante Unternehmen
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Admin legt an und plant (direkt/initiativ). Monitor schlägt vor — klar als Vorschlag
            markiert.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAddSource('admin_ui')
            setShowAdd((v) => !v)
          }}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4" aria-hidden />
          Interessantes Unternehmen
        </button>
      </div>

      <section
        aria-labelledby="company-bookmarklet-heading"
        className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-zinc-100 p-2 text-zinc-700">
            <Bookmark className="w-4 h-4" aria-hidden />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 id="company-bookmarklet-heading" className="text-sm font-semibold text-zinc-900">
              Unternehmen → Pool (Bookmarklet)
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Auf einer Firmenwebsite (z.&nbsp;B. lmis.de) klicken → URL, Domain als Name und
              Markierung werden hier vorausgefüllt. Danach speichern und optional planen/beworben
              markieren.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5 space-y-2">
          <p className="text-xs font-semibold text-sky-950">Bookmarklet manuell anlegen</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-sky-900 leading-relaxed">
            <li>
              <span className="font-medium">Code kopieren</span>
            </li>
            <li>
              Chrome: Lesezeichenleiste → Rechtsklick →{' '}
              <span className="font-medium">Lesezeichen hinzufügen</span>
            </li>
            <li>
              Name: <span className="font-medium">Unternehmen → Pool</span>
            </li>
            <li>
              URL: kopierten Text einfügen (muss mit{' '}
              <code className="text-[10px]">javascript:</code> beginnen)
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyBookmarkletCode()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Copy className="w-4 h-4" aria-hidden />
            {bookmarkletCopied ? 'Kopiert!' : 'Bookmarklet-Code kopieren'}
          </button>
          <button
            type="button"
            onClick={() => void handleClipboardImport()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            <ClipboardPaste className="w-4 h-4" aria-hidden />
            Zwischenablage importieren
          </button>
          <a
            ref={bookmarkletLinkRef}
            onClick={(e) => {
              e.preventDefault()
              setBookmarkletHint(true)
            }}
            draggable
            onDragStart={(e) => {
              if (bookmarkletHref) {
                e.dataTransfer.setData('text/uri-list', bookmarkletHref)
                e.dataTransfer.setData('text/plain', bookmarkletHref)
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-dashed border-zinc-400 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 cursor-grab active:cursor-grabbing"
            title="Optional: in die Lesezeichenleiste ziehen"
            tabIndex={0}
          >
            <Bookmark className="w-4 h-4" aria-hidden />
            Unternehmen → Pool (ziehen)
          </a>
        </div>

        {bookmarkletCopied && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            Code in der Zwischenablage. Als Lesezeichen-URL einfügen.
          </p>
        )}
        {bookmarkletHint && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Nicht hier anklicken — Code kopieren und als{' '}
            <code className="text-[10px]">javascript:…</code>-Lesezeichen anlegen.
          </p>
        )}
        {importMissBanner && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Kein Import empfangen. Bookmarklet erneut ausführen oder „Zwischenablage importieren“
            nutzen.
          </p>
        )}
        {bookmarkletHref && (
          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer hover:text-zinc-800">Bookmarklet-Code anzeigen</summary>
            <textarea
              readOnly
              value={bookmarkletHref}
              className="mt-2 w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-[10px] h-20"
            />
          </details>
        )}
      </section>

      <div className="flex gap-1 border-b border-zinc-200">
        {(
          [
            { id: 'directory' as const, label: 'Verzeichnis', count: companies.length },
            {
              id: 'job_suggestions' as const,
              label: 'Stellen-Vorschläge',
              count: openJobs.length,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'px-3 py-2 text-sm border-b-2 -mb-px',
              tab === t.id
                ? 'border-zinc-900 text-zinc-900 font-medium'
                : 'border-transparent text-zinc-500 hover:text-zinc-800',
            ].join(' ')}
          >
            {t.label}
            <span className="ml-1.5 tabular-nums text-zinc-400">{t.count}</span>
          </button>
        ))}
      </div>

      {notice && (
        <div role="status" className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={(e) => void handleAddCompany(e)}
          className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              Interessantes Unternehmen anlegen
            </h2>
            <SourceChip fromSuggestion={false} />
          </div>
          <p className="text-xs text-zinc-600">
            Wie ein Monitor-Vorschlag, aber von dir selbst — landet direkt im Verzeichnis.
            {addSource === 'bookmarklet' ? ' (aus Bookmarklet vorausgefüllt)' : ''}
          </p>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Name *</span>
            <input
              required
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="z. B. LMIS"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Website / source_url</span>
            <div className="flex gap-2">
              <input
                type="url"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                onBlur={prefillFromUrl}
                placeholder="https://www.lmis.de/"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={prefillFromUrl}
                className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50"
              >
                Name aus Domain
              </button>
            </div>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Notiz</span>
            <textarea
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={busyId === 'add'}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Speichern
          </button>
        </form>
      )}

      {loading && (
        <p className="inline-flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Laden …
        </p>
      )}

      {!loading && tab === 'directory' && (
        <section className="space-y-3">
          {pendingCompanies.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-amber-800">
                Neue Monitor-Vorschläge ({pendingCompanies.length})
              </p>
              <p className="text-xs text-amber-900/80">
                Caro hat spannende Unternehmen vorgeschlagen — bereits im Verzeichnis synchronisiert.
                Hier Inbox quittieren.
              </p>
              <ul className="space-y-2">
                {pendingCompanies.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white border border-amber-100 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-zinc-900">{item.company_name}</p>
                        <SourceChip fromSuggestion />
                      </div>
                      <a
                        href={item.company_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 break-all"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                        {item.company_url}
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void setCompanySugStatus(item.id, 'gesehen')}
                        className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white"
                      >
                        Gesehen
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void setCompanySugStatus(item.id, 'archiviert')}
                        className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs"
                      >
                        Archiv
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" aria-hidden /> Aktiv
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Schon beworben
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" aria-hidden /> Monitor-Vorschlag
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" aria-hidden /> Rückmeldung
            </span>
          </div>

          {companies.length === 0 ? (
            <p className="text-sm text-zinc-500">Noch keine Unternehmen im Verzeichnis.</p>
          ) : (
            <ul className="space-y-2">
              {companies.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(c)}
                    className="w-full text-left rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-zinc-900 truncate">{c.name}</p>
                          <SourceChip fromSuggestion={c.badges.fromSuggestion} />
                        </div>
                        {c.website_url && (
                          <p className="mt-0.5 text-xs text-zinc-500 truncate">{c.website_url}</p>
                        )}
                        <p className="mt-2 text-xs text-zinc-500">
                          Letzter Kontakt: {formatDate(c.last_contact_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <BadgeIcon title="Aktiv (offen/geplant/in Arbeit)" active={c.badges.active}>
                          <Activity className="w-3.5 h-3.5" aria-hidden />
                        </BadgeIcon>
                        <BadgeIcon title="Schon mal beworben" active={c.badges.appliedBefore}>
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
                        </BadgeIcon>
                        <BadgeIcon title="Vorschlag von Monitor" active={c.badges.fromSuggestion}>
                          <Sparkles className="w-3.5 h-3.5" aria-hidden />
                        </BadgeIcon>
                        <BadgeIcon title="Rückmeldung vorhanden" active={c.badges.hasFeedback}>
                          <MessageSquare className="w-3.5 h-3.5" aria-hidden />
                        </BadgeIcon>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && tab === 'job_suggestions' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-zinc-500" aria-hidden />
            <h2 className="text-sm font-semibold">Stellen-Vorschläge von Monitor</h2>
          </div>
          {openJobs.length === 0 ? (
            <p className="text-sm text-zinc-500">Keine neuen Stellen-Vorschläge.</p>
          ) : (
            <ul className="space-y-2">
              {openJobs.map((item) => (
                <li key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                      {item.company_name}
                    </p>
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-600"
                    >
                      <ExternalLink className="w-3 h-3" aria-hidden />
                      Link
                    </a>
                  )}
                  {item.notes?.trim() && (
                    <p className="text-sm text-zinc-600 whitespace-pre-wrap">{item.notes}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void adoptJob(item)}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white"
                    >
                      In Pool übernehmen
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void rejectJob(item.id)}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs"
                    >
                      Ablehnen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <aside
            className="h-full w-full max-w-md bg-white shadow-xl border-l border-zinc-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Unternehmen ${selected.name}`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">Unternehmen</p>
                <h2 className="mt-1 text-lg font-semibold truncate">{selected.name}</h2>
                <div className="mt-2">
                  <SourceChip fromSuggestion={selected.badges.fromSuggestion} />
                </div>
                {selected.website_url && (
                  <a
                    href={selected.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 break-all"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                    {selected.website_url}
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-zinc-200 p-1.5 text-zinc-500 hover:text-zinc-900"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <div className="px-5 py-3 flex flex-wrap gap-1.5 border-b border-zinc-100">
              <BadgeIcon title="Aktiv" active={selected.badges.active}>
                <Activity className="w-3.5 h-3.5" aria-hidden />
              </BadgeIcon>
              <BadgeIcon title="Schon beworben" active={selected.badges.appliedBefore}>
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
              </BadgeIcon>
              <BadgeIcon title="Monitor-Vorschlag" active={selected.badges.fromSuggestion}>
                <Sparkles className="w-3.5 h-3.5" aria-hidden />
              </BadgeIcon>
              <BadgeIcon title="Rückmeldung" active={selected.badges.hasFeedback}>
                <MessageSquare className="w-3.5 h-3.5" aria-hidden />
              </BadgeIcon>
              <p className="w-full text-xs text-zinc-500 mt-1">
                Letzter Kontakt: {formatDate(selected.last_contact_at)}
              </p>
            </div>

            <div className="border-b border-zinc-100 px-5 py-4 space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                Bewerbung planen (Admin)
              </h3>
              <p className="text-xs text-zinc-500">
                Monitor darf nur vorschlagen — Planen und „Beworben“ ist Admin-only und nutzt Pool +
                Plan wie bei Stellen.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPlanType('initiative')}
                  className={[
                    'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium',
                    planType === 'initiative'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700',
                  ].join(' ')}
                >
                  Initiativ
                </button>
                <button
                  type="button"
                  onClick={() => setPlanType('regular')}
                  className={[
                    'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium',
                    planType === 'regular'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700',
                  ].join(' ')}
                >
                  Direkt (Stelle)
                </button>
              </div>
              {planType === 'regular' && (
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-zinc-600">Stellen-Titel</span>
                  <input
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder={`Stelle bei ${selected.name}`}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>
              )}
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">
                  {planType === 'initiative' ? 'Zielbereich / Notiz' : 'Notiz'}
                </span>
                <textarea
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Plan-Datum</span>
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={planAlsoApply}
                  onChange={(e) => setPlanAlsoApply(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                Beim Planen auch als beworben markieren
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={busyId === `flow-${selected.id}`}
                  onClick={() => void runCompanyFlow(planAlsoApply ? 'plan_and_apply' : 'plan')}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                  In Pool legen &amp; planen
                </button>
                <button
                  type="button"
                  disabled={busyId === `flow-${selected.id}`}
                  onClick={() => void runCompanyFlow('apply')}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden />
                  Als beworben markieren
                </button>
                <Link
                  to="/admin/pool"
                  className="text-center text-xs text-zinc-500 hover:text-zinc-800 underline-offset-2 hover:underline"
                >
                  Zum Stellen-Pool
                </Link>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-3">
                History
              </h3>
              {eventsLoading && (
                <p className="text-sm text-zinc-500 inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Laden …
                </p>
              )}
              {!eventsLoading && events.length === 0 && (
                <p className="text-sm text-zinc-500">Noch keine Events.</p>
              )}
              <ol className="space-y-3">
                {events.map((ev) => (
                  <li key={ev.id} className="relative pl-4 border-l border-zinc-200">
                    <p className="text-sm font-medium text-zinc-900">
                      {COMPANY_EVENT_LABELS[ev.event_type] ?? ev.event_type}
                    </p>
                    <p className="text-[11px] text-zinc-400">{formatDate(ev.created_at)}</p>
                    {typeof ev.payload?.job_title === 'string' && (
                      <p className="text-xs text-zinc-600 mt-1">{ev.payload.job_title}</p>
                    )}
                    {typeof ev.payload?.title === 'string' && (
                      <p className="text-xs text-zinc-600 mt-1">{ev.payload.title}</p>
                    )}
                    {ev.note?.trim() && (
                      <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">{ev.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
