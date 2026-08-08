import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  Building2,
  ClipboardPaste,
  Copy,
  ExternalLink,
  LayoutGrid,
  List,
  LogOut,
  Pencil,
  Plus,
  Send,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ThemeSwitcher } from '../../components/ThemeSwitcher'
import { MonitorFlipCard } from '../../components/monitor/MonitorFlipCard'
import { MonitorPoolEditor } from '../../components/monitor/MonitorPoolEditor'
import { MonitorProfilePanel } from '../../components/monitor/MonitorProfilePanel'
import { listApplications } from '../../lib/atsApi'
import { guessCompanyFromTitle } from '../../lib/atsBookmarklet'
import {
  displayNameFromUser,
  resolveAdminPoolOwnerId,
} from '../../lib/atsMonitorApi'
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
import {
  ATS_POOL_BOOKMARKLET_EVENT,
  buildPoolBookmarkletHref,
  claimPoolBookmarkletPayload,
  consumePoolBookmarkletHash,
  guessCompanyFromUrl,
  loadPoolBookmarkletPayload,
  readPoolBookmarkletFromClipboard,
  savePoolBookmarkletPayload,
  type AtsPoolBookmarkletPayload,
} from '../../lib/atsPoolBookmarklet'
import {
  createJobPoolEntry,
  listJobPoolEntries,
} from '../../lib/atsPoolApi'
import { createCompanySuggestion } from '../../lib/atsSuggestionsApi'
import type { ApplicationRow, JobPoolRow, JobPoolStatus } from '../../types/ats'

type MonitorTab = 'offen' | 'verschickt' | 'rueckmeldungen'
type PanelMode = null | 'add-job' | 'company' | 'profile'
type ViewMode = 'list' | 'cards'

const POOL_STATUS_LABEL: Record<JobPoolStatus, string> = {
  gesammelt: 'Gesammelt',
  geplant: 'Geplant',
  in_arbeit: 'In Arbeit',
  erledigt: 'Erledigt',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function truncate(text: string | null | undefined, max = 160): string {
  const t = (text ?? '').trim()
  if (!t) return ''
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

/** Öffentliche Stellen-URL: source_url, sonst erster Eintrag in links. */
function resolveJobSourceUrl(item: JobPoolRow): string | null {
  const fromSource = item.source_url?.trim()
  if (fromSource) return fromSource
  const fromLinks = item.links?.find((l) => l.url?.trim())?.url?.trim()
  return fromLinks || null
}

function resolvePoolImportFields(payload: AtsPoolBookmarkletPayload): {
  title: string
  company_name: string
  job_description: string | null
  source_url: string | null
} {
  const title =
    payload.title.trim() ||
    (payload.url ? 'Stelle (ohne Titel)' : 'Stelle (Import)')
  const company_name =
    payload.company?.trim() ||
    guessCompanyFromTitle(payload.title) ||
    guessCompanyFromUrl(payload.url) ||
    'Unbekannt'
  return {
    title,
    company_name,
    job_description: payload.text.trim() || null,
    source_url: payload.url.trim() || null,
  }
}

function Badge({ label }: { label: string }) {
  return <span className="monitor-shell__badge">{label}</span>
}

export function MonitorPage() {
  const { user, signOut } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<MonitorTab>('offen')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [pool, setPool] = useState<JobPoolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [panel, setPanel] = useState<PanelMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [jobTitle, setJobTitle] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [jobNotes, setJobNotes] = useState('')
  const [jobRaw, setJobRaw] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [companyUrl, setCompanyUrl] = useState('')
  const [companyNotes, setCompanyNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [bookmarkletHref, setBookmarkletHref] = useState('')
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false)
  const [companyBookmarkletHref, setCompanyBookmarkletHref] = useState('')
  const [companyBookmarkletCopied, setCompanyBookmarkletCopied] = useState(false)
  const [clipboardHint, setClipboardHint] = useState(false)
  const [importMissBanner, setImportMissBanner] = useState(false)
  const bookmarkletLinkRef = useRef<HTMLAnchorElement>(null)
  const companyBookmarkletLinkRef = useRef<HTMLAnchorElement>(null)
  const importLockRef = useRef(false)
  const importReceivedRef = useRef(false)
  const companyImportReceivedRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [appsRes, poolRes] = await Promise.all([
      listApplications(),
      listJobPoolEntries(),
    ])
    if (appsRes.error || poolRes.error) {
      setError(appsRes.error || poolRes.error)
      setLoading(false)
      return
    }
    setApplications(appsRes.data)
    setPool(poolRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    document.body.style.overflowY = 'auto'
    return () => {
      document.body.style.overflowY = ''
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const origin = window.location.origin
    setBookmarkletHref(buildPoolBookmarkletHref(origin, '/monitor'))
    setCompanyBookmarkletHref(buildCompanyBookmarkletHref(origin, '/monitor'))
  }, [])

  useEffect(() => {
    const el = bookmarkletLinkRef.current
    if (!el || !bookmarkletHref) return
    el.setAttribute('href', bookmarkletHref)
  }, [bookmarkletHref])

  useEffect(() => {
    const el = companyBookmarkletLinkRef.current
    if (!el || !companyBookmarkletHref) return
    el.setAttribute('href', companyBookmarkletHref)
  }, [companyBookmarkletHref])

  const openPool = useMemo(
    () => pool.filter((p) => p.status === 'gesammelt' || p.status === 'geplant'),
    [pool],
  )

  const openApps = useMemo(
    () =>
      applications.filter(
        (a) => a.status === 'Gefunden' || a.status === 'In Bearbeitung',
      ),
    [applications],
  )

  const sent = useMemo(
    () => applications.filter((a) => a.status === 'Beworben'),
    [applications],
  )

  const feedback = useMemo(
    () =>
      applications.filter(
        (a) =>
          a.status === 'Interview' ||
          a.status === 'Absage' ||
          Boolean(a.feedback_notes?.trim()),
      ),
    [applications],
  )

  const editingEntry = useMemo(
    () => (editingId ? pool.find((p) => p.id === editingId) ?? null : null),
    [editingId, pool],
  )

  const importPoolPayload = useCallback(
    async (payload: AtsPoolBookmarkletPayload) => {
      if (!payload.text && !payload.title && !payload.url) return
      if (importLockRef.current) return
      if (!claimPoolBookmarkletPayload(payload)) return

      importLockRef.current = true
      importReceivedRef.current = true
      setImportMissBanner(false)
      setClipboardHint(false)
      setImporting(true)
      setError(null)
      setNotice(null)

      const { userId, error: ownerError } = await resolveAdminPoolOwnerId()
      if (!userId) {
        setImporting(false)
        importLockRef.current = false
        setError(ownerError || 'Admin-Pool-Besitzer nicht gefunden.')
        return
      }

      const fields = resolvePoolImportFields(payload)
      const { data, error: createError } = await createJobPoolEntry({
        user_id: userId,
        application_type: 'regular',
        title: fields.title,
        company_name: fields.company_name,
        status: 'gesammelt',
        source_url: fields.source_url,
        job_description: fields.job_description,
      })

      setImporting(false)

      if (createError || !data) {
        importLockRef.current = false
        setError(
          createError
            ? `Import fehlgeschlagen: ${createError}`
            : 'Import fehlgeschlagen.',
        )
        return
      }

      setNotice('Stelle in Svens Pool übernommen — du kannst Details noch anpassen.')
      await load()
      setEditingId(data.id)
      setPanel(null)
      setTab('offen')
      window.setTimeout(() => {
        importLockRef.current = false
      }, 800)
    },
    [load],
  )

  const tryClipboardImport = useCallback(
    async (allowPlain = false): Promise<boolean> => {
      const fromClip = await readPoolBookmarkletFromClipboard({ allowPlain })
      if (!fromClip) return false
      savePoolBookmarkletPayload(fromClip)
      await importPoolPayload(fromClip)
      return true
    },
    [importPoolPayload],
  )

  const applyCompanyBookmarkletPayload = useCallback(
    (payload: AtsCompanyBookmarkletPayload) => {
      if (!claimCompanyBookmarkletPayload(payload)) return
      companyImportReceivedRef.current = true
      const fields = resolveCompanyImportFields(payload)
      setCompanyName(fields.name)
      setCompanyUrl(fields.website_url)
      setCompanyNotes(fields.notes)
      setPanel('company')
      setEditingId(null)
      setNotice(
        'Firmen-Bookmarklet vorausgefüllt — als spannendes Unternehmen vorschlagen.',
      )
    },
    [],
  )

  useEffect(() => {
    if (!user) return

    const fromParam = searchParams.get('from')
    const fromCompanyBookmarklet = fromParam === 'company-bookmarklet'
    const fromBookmarklet = fromParam === 'bookmarklet'
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

    async function ingestCompany() {
      const stored = loadCompanyBookmarkletPayload()
      if (stored) {
        applyCompanyBookmarkletPayload(stored)
        return true
      }
      const fromHash = consumeCompanyBookmarkletHash()
      if (fromHash) {
        saveCompanyBookmarkletPayload(fromHash)
        applyCompanyBookmarkletPayload(fromHash)
        return true
      }
      if (wantClipboard && fromCompanyBookmarklet) {
        const fromClip = await readCompanyBookmarkletFromClipboard()
        if (fromClip) {
          saveCompanyBookmarkletPayload(fromClip)
          applyCompanyBookmarkletPayload(fromClip)
          return true
        }
      }
      return false
    }

    async function ingestPool() {
      if (fromCompanyBookmarklet) return false

      const stored = loadPoolBookmarkletPayload()
      if (stored) {
        await importPoolPayload(stored)
        return true
      }

      const fromHash = consumePoolBookmarkletHash()
      if (fromHash) {
        savePoolBookmarkletPayload(fromHash)
        await importPoolPayload(fromHash)
        return true
      }

      if (wantClipboard && fromBookmarklet) {
        const ok = await tryClipboardImport(false)
        if (ok) return true
        if (!cancelled) setClipboardHint(true)
      }

      return false
    }

    void (async () => {
      const gotCompany = await ingestCompany()
      if (cancelled) return
      if (gotCompany) {
        clearImportQuery()
        return
      }

      const gotPool = await ingestPool()
      if (cancelled) return
      if (gotPool || fromBookmarklet || (wantClipboard && !fromCompanyBookmarklet)) {
        clearImportQuery()
      }

      if (fromCompanyBookmarklet && !companyImportReceivedRef.current) {
        missTimer = window.setTimeout(() => {
          if (cancelled || companyImportReceivedRef.current) return
          const late = loadCompanyBookmarkletPayload()
          if (late) {
            applyCompanyBookmarkletPayload(late)
            return
          }
          setNotice(
            'Kein Firmen-Import erkannt. Bookmarklet erneut ausführen oder Formular manuell füllen.',
          )
        }, 4500)
        return
      }

      if ((fromBookmarklet || (wantClipboard && !fromCompanyBookmarklet)) && !importReceivedRef.current) {
        missTimer = window.setTimeout(() => {
          if (cancelled || importReceivedRef.current) return
          const late = loadPoolBookmarkletPayload()
          if (late) {
            void importPoolPayload(late)
            return
          }
          setImportMissBanner(true)
          if (wantClipboard) setClipboardHint(true)
        }, 4500)
      }
    })()

    function onPoolBookmarkletEvent(event: Event) {
      const detail = (event as CustomEvent<AtsPoolBookmarkletPayload>).detail
      if (!detail) return
      void importPoolPayload(detail)
    }

    function onCompanyBookmarkletEvent(event: Event) {
      const detail = (event as CustomEvent<AtsCompanyBookmarkletPayload>).detail
      if (!detail) return
      applyCompanyBookmarkletPayload(detail)
    }

    window.addEventListener(ATS_POOL_BOOKMARKLET_EVENT, onPoolBookmarkletEvent)
    window.addEventListener(ATS_COMPANY_BOOKMARKLET_EVENT, onCompanyBookmarkletEvent)

    return () => {
      cancelled = true
      if (missTimer) window.clearTimeout(missTimer)
      window.removeEventListener(ATS_POOL_BOOKMARKLET_EVENT, onPoolBookmarkletEvent)
      window.removeEventListener(ATS_COMPANY_BOOKMARKLET_EVENT, onCompanyBookmarkletEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, importPoolPayload, tryClipboardImport, applyCompanyBookmarkletPayload])

  async function copyBookmarkletCode() {
    if (!bookmarkletHref) {
      setError('Bookmarklet-Code noch nicht bereit — Seite kurz neu laden.')
      return
    }
    try {
      await navigator.clipboard.writeText(bookmarkletHref)
      setBookmarkletCopied(true)
      window.setTimeout(() => setBookmarkletCopied(false), 2500)
    } catch {
      setError(
        'Clipboard blockiert. Unten den Code manuell markieren und als Lesezeichen-URL einfügen.',
      )
    }
  }

  async function copyCompanyBookmarkletCode() {
    if (!companyBookmarkletHref) {
      setError('Firmen-Bookmarklet noch nicht bereit — Seite kurz neu laden.')
      return
    }
    try {
      await navigator.clipboard.writeText(companyBookmarkletHref)
      setCompanyBookmarkletCopied(true)
      window.setTimeout(() => setCompanyBookmarkletCopied(false), 2500)
    } catch {
      setError(
        'Clipboard blockiert. Firmen-Bookmarklet-Code manuell markieren und als Lesezeichen-URL einfügen.',
      )
    }
  }

  async function handleClipboardImportClick() {
    setError(null)
    setImportMissBanner(false)
    const ok = await tryClipboardImport(true)
    if (!ok) {
      setError(
        'Zwischenablage leer oder zu kurz. Job-Text markieren → kopieren, dann erneut importieren.',
      )
      setClipboardHint(true)
    }
  }

  async function handleCompanyClipboardImport() {
    setError(null)
    const fromClip = await readCompanyBookmarkletFromClipboard()
    if (!fromClip) {
      setNotice(
        'Keine Firmen-Bookmarklet-Daten in der Zwischenablage. Bookmarklet auf der Unternehmensseite ausführen.',
      )
      return
    }
    saveCompanyBookmarkletPayload(fromClip)
    applyCompanyBookmarkletPayload(fromClip)
  }

  async function handleLogout() {
    await signOut()
  }

  async function submitJobToPool(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setNotice(null)
    setError(null)

    const { userId, error: ownerError } = await resolveAdminPoolOwnerId()
    if (!userId) {
      setSubmitting(false)
      setError(ownerError || 'Admin-Pool-Besitzer nicht gefunden.')
      return
    }

    const { data, error: err } = await createJobPoolEntry({
      user_id: userId,
      application_type: 'regular',
      title: jobTitle,
      company_name: jobCompany,
      status: 'gesammelt',
      source_url: jobUrl || null,
      notes: jobNotes || null,
      job_description: jobRaw || null,
    })
    setSubmitting(false)

    if (err || !data) {
      setError(err || 'Speichern fehlgeschlagen.')
      return
    }

    setJobTitle('')
    setJobCompany('')
    setJobUrl('')
    setJobNotes('')
    setJobRaw('')
    setPanel(null)
    setNotice('Stelle in Svens Pool übernommen.')
    await load()
    setEditingId(data.id)
    setTab('offen')
  }

  async function submitCompany(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setNotice(null)
    const { error: err } = await createCompanySuggestion({
      company_name: companyName,
      company_url: companyUrl,
      notes: companyNotes,
    })
    setSubmitting(false)
    if (err) {
      setNotice(err)
      return
    }
    setCompanyName('')
    setCompanyUrl('')
    setCompanyNotes('')
    setPanel(null)
    setNotice('Unternehmen vorgeschlagen — Admin sieht es unter „Interessante Unternehmen“.')
  }

  function startEdit(id: string, e?: ReactMouseEvent) {
    e?.stopPropagation()
    e?.preventDefault()
    setEditingId(id)
    setPanel(null)
  }

  const tabs: Array<{ id: MonitorTab; label: string; count: number }> = [
    { id: 'offen', label: 'Offen / geplant', count: openPool.length + openApps.length },
    { id: 'verschickt', label: 'Verschickt', count: sent.length },
    { id: 'rueckmeldungen', label: 'Rückmeldungen', count: feedback.length },
  ]

  const profileLabel = displayNameFromUser(user) || user?.email || 'Profil'

  function renderPoolList(items: JobPoolRow[]) {
    if (items.length === 0) {
      return <p className="text-sm monitor-shell__muted">Keine offenen Pool-Einträge.</p>
    }

    if (viewMode === 'cards') {
      return (
        <div className="monitor-card-grid">
          {items.map((item) => {
            const jobUrl = resolveJobSourceUrl(item)
            return (
              <MonitorFlipCard
                key={item.id}
                ariaLabel={`${item.company_name}: ${item.title || 'Ohne Titel'}`}
                front={
                  <>
                    <p className="text-[10px] uppercase tracking-[0.14em] monitor-shell__muted truncate">
                      {item.company_name || 'Firma'}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-snug line-clamp-4">
                      {item.title || 'Ohne Titel'}
                    </p>
                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                      <Badge label={POOL_STATUS_LABEL[item.status]} />
                      {jobUrl ? (
                        <a
                          href={jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="monitor-shell__btn monitor-shell__btn--ghost !p-1.5 shrink-0"
                          aria-label="Zur Stelle"
                          title="Zur Stelle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </>
                }
                back={
                  <>
                    <p className="text-xs font-medium">{item.company_name}</p>
                    <p className="mt-1 text-[11px] monitor-shell__muted">
                      Angelegt {formatDate(item.created_at)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed flex-1 overflow-hidden">
                      {truncate(item.job_description || item.notes, 220) ||
                        'Keine Beschreibung.'}
                    </p>
                    <div className="mt-2 flex flex-col gap-1.5">
                      {jobUrl ? (
                        <a
                          href={jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="monitor-shell__btn monitor-shell__btn--ghost w-full justify-center text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                          Zur Stelle
                        </a>
                      ) : null}
                      <button
                        type="button"
                        className="monitor-shell__btn monitor-shell__btn--primary w-full justify-center text-xs"
                        onClick={(e) => startEdit(item.id, e)}
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden />
                        Bearbeiten
                      </button>
                    </div>
                  </>
                }
              />
            )
          })}
        </div>
      )
    }

    return (
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="monitor-shell__panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.12em] monitor-shell__muted truncate">
                  {item.company_name || 'Firma'}
                </p>
                <p className="text-sm font-semibold truncate">
                  {item.title || 'Ohne Titel'}
                </p>
              </div>
              <Badge label={POOL_STATUS_LABEL[item.status]} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs monitor-shell__muted">
                Angelegt {formatDate(item.created_at)}
              </p>
              <button
                type="button"
                onClick={() => startEdit(item.id)}
                className="monitor-shell__btn monitor-shell__btn--ghost !py-1 !px-2 text-xs"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden />
                Bearbeiten
              </button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  function renderAppList(items: ApplicationRow[], empty: string, dateLabel: (a: ApplicationRow) => string) {
    if (items.length === 0) {
      return <p className="text-sm monitor-shell__muted">{empty}</p>
    }

    if (viewMode === 'cards') {
      return (
        <div className="monitor-card-grid">
          {items.map((app) => (
            <MonitorFlipCard
              key={app.id}
              ariaLabel={`${app.company_name}: ${app.job_title}`}
              front={
                <>
                  <p className="text-[10px] uppercase tracking-[0.14em] monitor-shell__muted truncate">
                    {app.company_name}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug line-clamp-4">
                    {app.job_title}
                  </p>
                  <div className="mt-auto pt-3">
                    <Badge label={app.status} />
                  </div>
                </>
              }
              back={
                <>
                  <p className="text-xs font-medium">{app.company_name}</p>
                  <p className="mt-1 text-[11px] monitor-shell__muted">{dateLabel(app)}</p>
                  <p className="mt-2 text-xs leading-relaxed flex-1 overflow-hidden">
                    {truncate(app.feedback_notes, 220) ||
                      'Status nur lesbar — Schreiben/Planen nur Admin.'}
                  </p>
                </>
              }
            />
          ))}
        </div>
      )
    }

    return (
      <ul className="space-y-2">
        {items.map((app) => (
          <li key={app.id} className="monitor-shell__panel p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.12em] monitor-shell__muted truncate">
                  {app.company_name}
                </p>
                <p className="text-sm font-semibold truncate">{app.job_title}</p>
              </div>
              <Badge label={app.status} />
            </div>
            <p className="text-xs monitor-shell__muted">{dateLabel(app)}</p>
            {app.feedback_notes?.trim() ? (
              <p className="text-sm whitespace-pre-wrap">{app.feedback_notes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="monitor-shell">
      <header className="monitor-shell__header">
        <div className="mx-auto max-w-4xl px-4 py-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] monitor-shell__muted font-medium">
              Personal ATS
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Monitor</h1>
            <p className="mt-1 text-sm monitor-shell__muted">
              Stellen in Svens Pool — Status lesen, Details bearbeiten.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ThemeSwitcher compact />
            <p className="text-xs monitor-shell__muted truncate max-w-[14rem]" title={profileLabel}>
              {profileLabel}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPanel((p) => (p === 'profile' ? null : 'profile'))
                  setEditingId(null)
                }}
                className="monitor-shell__btn monitor-shell__btn--ghost !py-1.5 !px-2.5 text-xs"
              >
                <UserRound className="w-3.5 h-3.5" aria-hidden />
                Profil
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="monitor-shell__btn monitor-shell__btn--ghost !py-1.5 !px-2.5 text-xs"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden />
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <section
          className="monitor-shell__panel p-4 space-y-3"
          aria-labelledby="monitor-bookmarklet-heading"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md border p-2" style={{ borderColor: 'var(--surface-border)' }}>
              <Bookmark className="w-4 h-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="monitor-bookmarklet-heading" className="text-sm font-semibold">
                Job → Pool (Bookmarklet)
              </h2>
              <p className="mt-1 text-xs monitor-shell__muted">
                Auf der Stellenanzeige klicken — landet direkt in Svens Stellen-Pool.
                Danach kannst du Details bearbeiten (kein Initiativ-/Bewerbungs-Umschalten).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyBookmarkletCode()}
              className="monitor-shell__btn monitor-shell__btn--primary"
            >
              <Copy className="w-4 h-4" aria-hidden />
              {bookmarkletCopied ? 'Kopiert!' : 'Bookmarklet-Code kopieren'}
            </button>
            <button
              type="button"
              onClick={() => void handleClipboardImportClick()}
              disabled={importing}
              className="monitor-shell__btn monitor-shell__btn--ghost"
            >
              <ClipboardPaste className="w-4 h-4" aria-hidden />
              {importing ? 'Importiere …' : 'Zwischenablage importieren'}
            </button>
            <a
              ref={bookmarkletLinkRef}
              className="monitor-shell__btn monitor-shell__btn--ghost cursor-grab text-xs"
              draggable
              onDragStart={(e) => {
                if (bookmarkletHref) {
                  e.dataTransfer.setData('text/uri-list', bookmarkletHref)
                  e.dataTransfer.setData('text/plain', bookmarkletHref)
                }
              }}
              onClick={(e) => e.preventDefault()}
            >
              Lesezeichen hierher ziehen
            </a>
          </div>

          {bookmarkletCopied && (
            <p className="text-xs monitor-shell__muted">
              Code in der Zwischenablage. Chrome-Lesezeichen anlegen und URL ersetzen.
            </p>
          )}
          {(clipboardHint || importMissBanner) && (
            <p className="text-xs monitor-shell__muted">
              Kein Auto-Import erkannt. Bitte „Zwischenablage importieren“ nutzen oder Bookmarklet neu anlegen.
            </p>
          )}
          {bookmarkletHref && (
            <textarea
              readOnly
              value={bookmarkletHref}
              rows={2}
              className="monitor-shell__input font-mono text-[10px]"
              aria-label="Bookmarklet-Code"
              onFocus={(e) => e.currentTarget.select()}
            />
          )}
        </section>

        <section
          className="monitor-shell__panel p-4 space-y-3"
          aria-labelledby="monitor-company-bookmarklet-heading"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md border p-2" style={{ borderColor: 'var(--surface-border)' }}>
              <Building2 className="w-4 h-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="monitor-company-bookmarklet-heading" className="text-sm font-semibold">
                Unternehmen → Vorschlag (Bookmarklet)
              </h2>
              <p className="mt-1 text-xs monitor-shell__muted">
                Auf einer Firmenwebsite klicken — Name, Link und Markierung werden vorausgefüllt.
                Du schlägst nur vor; Planen/Beworben macht Sven im Admin.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyCompanyBookmarkletCode()}
              className="monitor-shell__btn monitor-shell__btn--primary"
            >
              <Copy className="w-4 h-4" aria-hidden />
              {companyBookmarkletCopied ? 'Kopiert!' : 'Firmen-Bookmarklet kopieren'}
            </button>
            <button
              type="button"
              onClick={() => void handleCompanyClipboardImport()}
              className="monitor-shell__btn monitor-shell__btn--ghost"
            >
              <ClipboardPaste className="w-4 h-4" aria-hidden />
              Zwischenablage → Vorschlag
            </button>
            <a
              ref={companyBookmarkletLinkRef}
              className="monitor-shell__btn monitor-shell__btn--ghost cursor-grab text-xs"
              draggable
              onDragStart={(e) => {
                if (companyBookmarkletHref) {
                  e.dataTransfer.setData('text/uri-list', companyBookmarkletHref)
                  e.dataTransfer.setData('text/plain', companyBookmarkletHref)
                }
              }}
              onClick={(e) => e.preventDefault()}
            >
              Lesezeichen hierher ziehen
            </a>
          </div>
          {companyBookmarkletCopied && (
            <p className="text-xs monitor-shell__muted">
              Code kopiert. Als Lesezeichen „Unternehmen → Vorschlag“ anlegen.
            </p>
          )}
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPanel('add-job')
              setEditingId(null)
              setNotice(null)
            }}
            className="monitor-shell__btn monitor-shell__btn--primary"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Stelle zum Pool
          </button>
          <button
            type="button"
            onClick={() => {
              setPanel('company')
              setEditingId(null)
              setNotice(null)
            }}
            className="monitor-shell__btn monitor-shell__btn--ghost"
          >
            <Building2 className="w-4 h-4" aria-hidden />
            Unternehmen vorschlagen
          </button>
          <div className="ml-auto monitor-view-toggle" role="group" aria-label="Ansicht">
            <button
              type="button"
              className={[
                'monitor-view-toggle__btn',
                viewMode === 'list' ? 'monitor-view-toggle__btn--active' : '',
              ].join(' ')}
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              <List className="w-3.5 h-3.5" aria-hidden />
              Liste
            </button>
            <button
              type="button"
              className={[
                'monitor-view-toggle__btn',
                viewMode === 'cards' ? 'monitor-view-toggle__btn--active' : '',
              ].join(' ')}
              aria-pressed={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden />
              Karten
            </button>
          </div>
        </div>

        {notice && (
          <div role="status" className="monitor-shell__panel px-3 py-2 text-sm">
            {notice}
          </div>
        )}

        {panel === 'profile' && (
          <MonitorProfilePanel
            user={user}
            onClose={() => setPanel(null)}
            onSaved={(msg) => setNotice(msg)}
          />
        )}

        {editingEntry && (
          <MonitorPoolEditor
            entry={editingEntry}
            onCancel={() => setEditingId(null)}
            onSaved={(row, msg) => {
              setPool((prev) => prev.map((p) => (p.id === row.id ? row : p)))
              setNotice(msg)
              setEditingId(null)
            }}
          />
        )}

        {panel === 'add-job' && (
          <form
            onSubmit={(e) => void submitJobToPool(e)}
            className="monitor-shell__panel p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Stelle in den Pool</h2>
              <button
                type="button"
                className="text-xs monitor-shell__muted"
                onClick={() => setPanel(null)}
              >
                Schließen
              </button>
            </div>
            <p className="text-xs monitor-shell__muted">
              Wird als reguläre Stelle (gesammelt) bei Sven angelegt — ohne Initiativ-Umschalten.
            </p>
            <label className="block space-y-1">
              <span className="text-xs font-medium monitor-shell__muted">Titel *</span>
              <input
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="monitor-shell__input"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium monitor-shell__muted">Firma *</span>
              <input
                required
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
                className="monitor-shell__input"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium monitor-shell__muted">Link</span>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://…"
                className="monitor-shell__input"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium monitor-shell__muted">Notiz</span>
              <textarea
                value={jobNotes}
                onChange={(e) => setJobNotes(e.target.value)}
                rows={2}
                className="monitor-shell__input resize-y"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium monitor-shell__muted">Rohtext (optional)</span>
              <textarea
                value={jobRaw}
                onChange={(e) => setJobRaw(e.target.value)}
                rows={4}
                className="monitor-shell__input resize-y font-mono"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="monitor-shell__btn monitor-shell__btn--primary"
            >
              <Send className="w-4 h-4" aria-hidden />
              {submitting ? 'Senden …' : 'In den Pool legen'}
            </button>
          </form>
        )}

        {panel === 'company' && (
          <form
            onSubmit={(e) => void submitCompany(e)}
            className="monitor-shell__panel p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Spannendes Unternehmen vorschlagen</h2>
              <button
                type="button"
                className="text-xs monitor-shell__muted"
                onClick={() => setPanel(null)}
              >
                Schließen
              </button>
            </div>
            <p className="text-xs monitor-shell__muted rounded-md border px-2.5 py-2" style={{ borderColor: 'var(--surface-border)' }}>
              Wird bei Sven als <strong>Monitor-Vorschlag</strong> für ein interessantes Unternehmen
              markiert — ohne Plan-/Beworben-Rechte.
            </p>
            <label className="block space-y-1">
              <span className="text-xs font-medium monitor-shell__muted">Name *</span>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="monitor-shell__input"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium monitor-shell__muted">Unternehmens-Link *</span>
              <input
                required
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://…"
                className="monitor-shell__input"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium monitor-shell__muted">Notiz (optional)</span>
              <textarea
                value={companyNotes}
                onChange={(e) => setCompanyNotes(e.target.value)}
                rows={2}
                className="monitor-shell__input resize-y"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="monitor-shell__btn monitor-shell__btn--primary"
            >
              <Send className="w-4 h-4" aria-hidden />
              {submitting ? 'Senden …' : 'Vorschlag senden'}
            </button>
          </form>
        )}

        <div className="flex gap-1 border-b" style={{ borderColor: 'var(--surface-border)' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'monitor-shell__tab',
                tab === t.id ? 'monitor-shell__tab--active' : '',
              ].join(' ')}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums monitor-shell__muted">{t.count}</span>
            </button>
          ))}
        </div>

        {loading && <p className="text-sm monitor-shell__muted">Daten werden geladen …</p>}
        {error && (
          <div
            role="alert"
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--surface-border)' }}
          >
            {error}
          </div>
        )}

        {!loading && !error && tab === 'offen' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] monitor-shell__muted mb-2">
                Stellen-Pool
              </h2>
              {renderPoolList(openPool)}
            </div>
            <div>
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] monitor-shell__muted mb-2">
                Bewerbungen in Arbeit
              </h2>
              {renderAppList(
                openApps,
                'Keine offenen Bewerbungen.',
                (a) => `Angelegt ${formatDate(a.created_at)}`,
              )}
            </div>
          </section>
        )}

        {!loading && !error && tab === 'verschickt' && (
          <section>
            {renderAppList(
              sent,
              'Noch keine verschickten Bewerbungen.',
              (a) => `Beworben am ${formatDate(a.applied_at)}`,
            )}
          </section>
        )}

        {!loading && !error && tab === 'rueckmeldungen' &&
          renderAppList(
            feedback,
            'Noch keine Rückmeldungen.',
            (a) =>
              a.feedback_at
                ? `Rückmeldung ${formatDate(a.feedback_at)}`
                : `Angelegt ${formatDate(a.created_at)}`,
          )}

        <p className="text-[11px] monitor-shell__muted flex items-center gap-1">
          <ExternalLink className="w-3 h-3" aria-hidden />
          Bewerbung anlegen, Initiativ umschalten, Generieren und Planen nur für Admin.
        </p>
      </main>
    </div>
  )
}
