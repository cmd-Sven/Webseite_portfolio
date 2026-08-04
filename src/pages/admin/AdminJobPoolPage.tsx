import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  CalendarDays,
  ClipboardPaste,
  Copy,
  ExternalLink,
  FileText,
  Inbox,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { guessCompanyFromTitle } from '../../lib/atsBookmarklet'
import {
  ATS_POOL_BOOKMARKLET_EVENT,
  ATS_POOL_BOOKMARKLET_STORAGE_KEY,
  ATS_POOL_JOB_MESSAGE_TYPE,
  buildPoolBookmarkletHref,
  claimPoolBookmarkletPayload,
  consumePoolBookmarkletHash,
  guessCompanyFromUrl,
  loadPoolBookmarkletPayload,
  payloadFromClipboardText,
  readPoolBookmarkletFromClipboard,
  savePoolBookmarkletPayload,
  type AtsPoolBookmarkletPayload,
} from '../../lib/atsPoolBookmarklet'
import {
  clearWbsCertificate,
  createJobPoolEntry,
  deleteJobPoolEntry,
  getWbsCertificateUrl,
  listJobPoolEntries,
  updateJobPoolEntry,
  uploadAndAttachWbsCertificate,
} from '../../lib/atsPoolApi'
import { fillInitiativeFieldsFromJobText } from '../../lib/extractCompanyContextFromJobText'
import {
  JOB_POOL_APPLICATION_TYPES,
  JOB_POOL_STATUSES,
  type JobPoolApplicationType,
  type JobPoolLink,
  type JobPoolRow,
  type JobPoolStatus,
} from '../../types/ats'

type TypeFilter = JobPoolApplicationType | 'Alle'
type StatusFilter = JobPoolStatus | 'Alle'

type FormState = {
  application_type: JobPoolApplicationType
  title: string
  company_name: string
  status: JobPoolStatus
  source_url: string
  linksText: string
  notes: string
  job_description: string
  company_info: string
  target_notes: string
}

const EMPTY_FORM: FormState = {
  application_type: 'regular',
  title: '',
  company_name: '',
  status: 'gesammelt',
  source_url: '',
  linksText: '',
  notes: '',
  job_description: '',
  company_info: '',
  target_notes: '',
}

const TYPE_LABEL: Record<JobPoolApplicationType, string> = {
  regular: 'Regulär',
  initiative: 'Initiativ',
}

const STATUS_LABEL: Record<JobPoolStatus, string> = {
  gesammelt: 'Gesammelt',
  geplant: 'Geplant',
  in_arbeit: 'In Arbeit',
  erledigt: 'Erledigt',
}

const STATUS_BADGE: Record<JobPoolStatus, string> = {
  gesammelt: 'bg-zinc-100 text-zinc-700',
  geplant: 'bg-sky-50 text-sky-800',
  in_arbeit: 'bg-amber-50 text-amber-800',
  erledigt: 'bg-emerald-50 text-emerald-800',
}

const EXTRACT_FIELD_LABEL: Record<string, string> = {
  company_info: 'Unternehmensinfos',
  target_notes: 'Zielbereich',
  notes: 'Kontakt/Notizen',
  links: 'Firmen-Link',
}

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-60'
const textareaClass = `${inputClass} leading-relaxed resize-y`

function formatDate(iso: string): string {
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

function linksToText(links: JobPoolLink[]): string {
  return links
    .map((link) => (link.label ? `${link.label} | ${link.url}` : link.url))
    .join('\n')
}

function parseLinksText(text: string): JobPoolLink[] {
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
    .filter((item): item is JobPoolLink => item != null)
}

function rowToForm(row: JobPoolRow): FormState {
  return {
    application_type: row.application_type,
    title: row.title ?? '',
    company_name: row.company_name,
    status: row.status,
    source_url: row.source_url ?? '',
    linksText: linksToText(row.links),
    notes: row.notes ?? '',
    job_description: row.job_description ?? '',
    company_info: row.company_info ?? '',
    target_notes: row.target_notes ?? '',
  }
}

function StatusBadge({ status }: { status: JobPoolStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        STATUS_BADGE[status],
      ].join(' ')}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

/** Best-effort Titel/Firma aus Bookmarklet-Payload. */
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

export function AdminJobPoolPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState<JobPoolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('Alle')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Alle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [wbsUrl, setWbsUrl] = useState<string | null>(null)
  const [wbsBusy, setWbsBusy] = useState(false)
  const [pendingWbsFile, setPendingWbsFile] = useState<File | null>(null)
  const [bookmarkletHref, setBookmarkletHref] = useState('')
  const [portfolioOrigin, setPortfolioOrigin] = useState('')
  const [bookmarkletHint, setBookmarkletHint] = useState(false)
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false)
  const [importMissBanner, setImportMissBanner] = useState(false)
  const [clipboardHint, setClipboardHint] = useState(false)
  const [pasteDraft, setPasteDraft] = useState('')
  const [importing, setImporting] = useState(false)
  const wbsInputRef = useRef<HTMLInputElement>(null)
  const formSectionRef = useRef<HTMLElement>(null)
  const companyInputRef = useRef<HTMLInputElement>(null)
  const bookmarkletLinkRef = useRef<HTMLAnchorElement>(null)
  const importLockRef = useRef(false)
  const importReceivedRef = useRef(false)

  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: listError } = await listJobPoolEntries({
      status: statusFilter,
      application_type: typeFilter,
    })
    setLoading(false)
    if (listError) {
      setError(listError)
      setEntries([])
      return
    }
    setEntries(data)
  }, [statusFilter, typeFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const origin = window.location.origin
    setPortfolioOrigin(origin)
    setBookmarkletHref(buildPoolBookmarkletHref(origin))
  }, [])

  // React blockiert javascript:-URLs in JSX-href (setzt oft
  // „React has blocked a javascript: URL…“). Nur per DOM setzen, ohne href-Prop.
  useEffect(() => {
    const el = bookmarkletLinkRef.current
    if (!el || !bookmarkletHref) return
    el.setAttribute('href', bookmarkletHref)
  }, [bookmarkletHref])

  const importPoolPayload = useCallback(
    async (payload: AtsPoolBookmarkletPayload) => {
      if (!user) return
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

      const fields = resolvePoolImportFields(payload)
      const { data, error: createError } = await createJobPoolEntry({
        user_id: user.id,
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
            : 'Import fehlgeschlagen (kein Eintrag zurückgegeben)',
        )
        return
      }

      setNotice('Stelle gesammelt')
      setStatusFilter('Alle')
      setTypeFilter('Alle')
      await load()
      setSelectedId(data.id)
      setForm(rowToForm(data))
    },
    [user, load],
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

  const importFromRawText = useCallback(
    async (raw: string): Promise<boolean> => {
      const payload = payloadFromClipboardText(raw, { allowPlain: true })
      if (!payload) return false
      savePoolBookmarkletPayload(payload)
      await importPoolPayload(payload)
      return true
    },
    [importPoolPayload],
  )

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

      if (wantClipboard) {
        const ok = await tryClipboardImport(false)
        if (ok) return true
        if (!cancelled) setClipboardHint(true)
      }

      return false
    }

    void ingestAvailable().then((got) => {
      if (cancelled) return
      if (got || fromBookmarklet || wantClipboard) clearImportQuery()

      if ((fromBookmarklet || wantClipboard) && !importReceivedRef.current) {
        missTimer = window.setTimeout(() => {
          if (cancelled || importReceivedRef.current) return
          // Späteres postMessage noch einmal prüfen
          const late = loadPoolBookmarkletPayload()
          if (late) {
            void importPoolPayload(late)
            return
          }
          setImportMissBanner(true)
          if (wantClipboard) setClipboardHint(true)
        }, 4500)
      }
    })

    function onPoolBookmarkletEvent(event: Event) {
      const detail = (event as CustomEvent<AtsPoolBookmarkletPayload>).detail
      if (!detail) return
      void importPoolPayload(detail)
    }

    window.addEventListener(ATS_POOL_BOOKMARKLET_EVENT, onPoolBookmarkletEvent)

    return () => {
      cancelled = true
      if (missTimer) window.clearTimeout(missTimer)
      window.removeEventListener(ATS_POOL_BOOKMARKLET_EVENT, onPoolBookmarkletEvent)
    }
    // Nur beim Mount / User-Wechsel – Query wird einmalig konsumiert
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, importPoolPayload, tryClipboardImport])

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

  async function handleClipboardImportClick() {
    setError(null)
    setImportMissBanner(false)
    const ok = await tryClipboardImport(true)
    if (!ok) {
      setError(
        'Zwischenablage leer oder zu kurz. Auf der Job-Seite Text markieren → kopieren, dann hier erneut „Zwischenablage importieren“.',
      )
      setClipboardHint(true)
    }
  }

  async function handlePasteDraftImport() {
    setError(null)
    setImportMissBanner(false)
    const ok = await importFromRawText(pasteDraft)
    if (!ok) {
      setError('Bitte mindestens ~20 Zeichen Stellen-Text einfügen.')
      return
    }
    setPasteDraft('')
    setClipboardHint(false)
  }
  useEffect(() => {
    let cancelled = false
    setWbsUrl(null)
    if (!selected?.wbs_certificate_path) return

    void getWbsCertificateUrl(selected.wbs_certificate_path).then(({ url, error: urlError }) => {
      if (cancelled) return
      if (urlError) {
        setError(urlError)
        return
      }
      setWbsUrl(url)
    })

    return () => {
      cancelled = true
    }
  }, [selected?.wbs_certificate_path, selected?.id])

  function startCreate() {
    setSelectedId(null)
    setForm(EMPTY_FORM)
    setPendingWbsFile(null)
    setWbsUrl(null)
    setNotice(null)
    setError(null)
    // Nach State-Reset (nächster Paint): Formular in den Viewport und Fokus setzen
    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      companyInputRef.current?.focus()
    }, 0)
  }

  function selectEntry(row: JobPoolRow) {
    setSelectedId(row.id)
    setForm(rowToForm(row))
    setPendingWbsFile(null)
    setNotice(null)
    setError(null)
  }

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  /** Regulär → Initiativ: leere Unternehmensfelder aus Stellenbeschreibung befüllen. */
  function setApplicationType(nextType: JobPoolApplicationType) {
    setForm((prev) => {
      if (prev.application_type === nextType) return prev
      if (nextType !== 'initiative') {
        return { ...prev, application_type: nextType }
      }

      const filled = fillInitiativeFieldsFromJobText(
        {
          company_info: prev.company_info,
          target_notes: prev.target_notes,
          notes: prev.notes,
          linksText: prev.linksText,
          job_description: prev.job_description,
          title: prev.title,
          source_url: prev.source_url,
          company_name: prev.company_name,
        },
        { force: false },
      )

      if (filled.filledKeys.length > 0) {
        const labels = filled.filledKeys
          .map((k) => EXTRACT_FIELD_LABEL[k] ?? k)
          .join(', ')
        window.setTimeout(() => {
          setNotice(`Initiativ: aus Stellenbeschreibung übernommen — ${labels}.`)
        }, 0)
      }

      return {
        ...prev,
        application_type: 'initiative',
        company_info: filled.company_info,
        target_notes: filled.target_notes,
        notes: filled.notes,
        linksText: filled.linksText,
      }
    })
  }

  function applyJobTextExtract(force: boolean) {
    setForm((prev) => {
      if (!prev.job_description.trim()) {
        window.setTimeout(() => {
          setError(
            'Keine Stellenbeschreibung vorhanden — Infos können nicht übernommen werden.',
          )
        }, 0)
        return prev
      }

      const filled = fillInitiativeFieldsFromJobText(
        {
          company_info: prev.company_info,
          target_notes: prev.target_notes,
          notes: prev.notes,
          linksText: prev.linksText,
          job_description: prev.job_description,
          title: prev.title,
          source_url: prev.source_url,
          company_name: prev.company_name,
        },
        { force },
      )

      window.setTimeout(() => {
        setError(null)
        if (filled.filledKeys.length === 0) {
          setNotice(
            force
              ? 'Keine Unternehmensinfos im Stellen-Text gefunden.'
              : 'Keine leeren Felder zum Befüllen — oder nichts Extrahierbares gefunden.',
          )
        } else {
          const labels = filled.filledKeys
            .map((k) => EXTRACT_FIELD_LABEL[k] ?? k)
            .join(', ')
          setNotice(`Aus Stellenbeschreibung übernommen: ${labels}.`)
        }
      }, 0)

      return {
        ...prev,
        application_type: 'initiative',
        company_info: filled.company_info,
        target_notes: filled.target_notes,
        notes: filled.notes,
        linksText: filled.linksText,
      }
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setError('Nicht angemeldet')
      return
    }

    if (!form.company_name.trim()) {
      setError('Unternehmensname ist erforderlich')
      return
    }
    if (form.application_type === 'regular' && !form.title.trim()) {
      setError('Titel ist bei regulären Einträgen erforderlich')
      return
    }

    setSaving(true)
    setError(null)
    setNotice(null)

    const payload = {
      application_type: form.application_type,
      title: form.application_type === 'regular' ? form.title.trim() : form.title.trim() || null,
      company_name: form.company_name.trim(),
      status: form.status,
      source_url: form.source_url.trim() || null,
      links: parseLinksText(form.linksText),
      notes: form.notes.trim() || null,
      // Rohtext behalten (auch bei Initiativ), damit Extraktion später möglich bleibt
      job_description: form.job_description.trim() || null,
      company_info:
        form.application_type === 'initiative' ? form.company_info.trim() || null : null,
      target_notes:
        form.application_type === 'initiative' ? form.target_notes.trim() || null : null,
    }

    if (selectedId) {
      const { data, error: updateError } = await updateJobPoolEntry(selectedId, payload)
      if (updateError || !data) {
        setSaving(false)
        setError(updateError || 'Speichern fehlgeschlagen')
        return
      }

      let next = data
      if (pendingWbsFile && form.application_type === 'initiative') {
        const { data: withWbs, error: wbsError } = await uploadAndAttachWbsCertificate(
          user.id,
          data.id,
          pendingWbsFile,
        )
        if (wbsError || !withWbs) {
          setSaving(false)
          setError(wbsError || 'WBS-Upload fehlgeschlagen')
          await load()
          return
        }
        next = withWbs
        setPendingWbsFile(null)
      }

      setSaving(false)
      setNotice('Eintrag aktualisiert')
      await load()
      setSelectedId(next.id)
      setForm(rowToForm(next))
      return
    }

    const { data, error: createError } = await createJobPoolEntry({
      user_id: user.id,
      ...payload,
    })
    if (createError || !data) {
      setSaving(false)
      setError(createError || 'Anlegen fehlgeschlagen')
      return
    }

    let next = data
    if (pendingWbsFile && form.application_type === 'initiative') {
      const { data: withWbs, error: wbsError } = await uploadAndAttachWbsCertificate(
        user.id,
        data.id,
        pendingWbsFile,
      )
      if (wbsError || !withWbs) {
        setSaving(false)
        setError(wbsError || 'Eintrag angelegt, aber WBS-Upload fehlgeschlagen')
        await load()
        setSelectedId(data.id)
        setForm(rowToForm(data))
        return
      }
      next = withWbs
      setPendingWbsFile(null)
    }

    setSaving(false)
    setNotice('Eintrag angelegt')
    await load()
    setSelectedId(next.id)
    setForm(rowToForm(next))
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!window.confirm('Diesen Pool-Eintrag wirklich löschen?')) return

    setSaving(true)
    setError(null)
    const { error: deleteError } = await deleteJobPoolEntry(selectedId)
    setSaving(false)
    if (deleteError) {
      setError(deleteError)
      return
    }
    setNotice('Eintrag gelöscht')
    startCreate()
    await load()
  }

  async function handleWbsFile(file: File | undefined) {
    if (!file) return

    if (selectedId && user && form.application_type === 'initiative') {
      setWbsBusy(true)
      setError(null)
      const { data, error: wbsError } = await uploadAndAttachWbsCertificate(
        user.id,
        selectedId,
        file,
      )
      setWbsBusy(false)
      if (wbsError || !data) {
        setError(wbsError || 'WBS-Upload fehlgeschlagen')
        return
      }
      setPendingWbsFile(null)
      setNotice('WBS-Bescheinigung hochgeladen')
      await load()
      setForm(rowToForm(data))
      return
    }

    setPendingWbsFile(file)
    setNotice(null)
  }

  async function handleRemoveWbs() {
    if (pendingWbsFile) {
      setPendingWbsFile(null)
      return
    }
    if (!selectedId) return

    setWbsBusy(true)
    setError(null)
    const { data, error: clearError } = await clearWbsCertificate(
      selectedId,
      selected?.wbs_certificate_path,
    )
    setWbsBusy(false)
    if (clearError || !data) {
      setError(clearError || 'Entfernen fehlgeschlagen')
      return
    }
    setWbsUrl(null)
    setNotice('WBS-Bescheinigung entfernt')
    await load()
    setForm(rowToForm(data))
  }

  const isInitiative = form.application_type === 'initiative'
  const isEditing = selectedId != null

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Stellen-Pool</h2>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xl">
            Stellen und Initiativziele schnell sammeln und verwalten — vor der Bewerbung und
            Tagesplanung.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to="/admin/plan"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors"
          >
            <CalendarDays className="w-4 h-4" aria-hidden />
            Plan erstellen für alle
          </Link>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Manuell anlegen
          </button>
        </div>
      </div>

      <section
        aria-labelledby="pool-bookmarklet-heading"
        className="rounded-lg border border-zinc-200 bg-white p-5 md:p-6 space-y-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-zinc-100 p-2 text-zinc-700">
            <Bookmark className="w-4 h-4" aria-hidden />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 id="pool-bookmarklet-heading" className="text-sm font-semibold text-zinc-900">
              Stelle sammeln (Bookmarklet / Zwischenablage)
            </h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Chrome/React blockieren oft <code className="text-[11px]">javascript:</code>
              -Links in der App. Deshalb: Code kopieren und als Lesezeichen-URL einfügen — oder
              Text manuell importieren
              {portfolioOrigin ? ` · Ziel: ${portfolioOrigin}` : ''}.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5 space-y-2">
          <p className="text-xs font-semibold text-sky-950">Empfohlen: Bookmarklet manuell anlegen</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-sky-900 leading-relaxed">
            <li>
              <span className="font-medium">Code kopieren</span> (Button unten)
            </li>
            <li>
              Chrome: Lesezeichenleiste → Rechtsklick →{' '}
              <span className="font-medium">Lesezeichen hinzufügen</span>
            </li>
            <li>
              Name: <span className="font-medium">Job → Pool</span>
            </li>
            <li>
              URL: den kopierten Text einfügen (muss mit{' '}
              <code className="text-[10px]">javascript:</code> beginnen — nicht die Pool-Seiten-URL)
            </li>
            <li>
              Auf einer Job-Seite auf <span className="font-medium">Job → Pool</span> klicken
              (Popups erlauben)
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyBookmarkletCode()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
          >
            <Copy className="w-4 h-4" aria-hidden />
            {bookmarkletCopied ? 'Kopiert!' : 'Bookmarklet-Code kopieren'}
          </button>
          <button
            type="button"
            onClick={() => void handleClipboardImportClick()}
            disabled={importing}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            <ClipboardPaste className="w-4 h-4" aria-hidden />
            Zwischenablage importieren
          </button>
          {/* kein href-Prop: React blockiert/überschreibt javascript: URLs */}
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
            className="inline-flex items-center justify-center gap-2 rounded-md border border-dashed border-zinc-400 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 transition-colors cursor-grab active:cursor-grabbing"
            title="Optional: in die Lesezeichenleiste ziehen (Chrome streift das oft)"
            tabIndex={0}
          >
            <Bookmark className="w-4 h-4" aria-hidden />
            Job → Pool (ziehen)
          </a>
        </div>

        {bookmarkletCopied && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            Code in der Zwischenablage. Jetzt Chrome-Lesezeichen anlegen und URL ersetzen.
          </p>
        )}

        {bookmarkletHint && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Nicht hier anklicken. Besser „Bookmarklet-Code kopieren“ und manuell als Lesezeichen
            mit <code className="text-[10px]">javascript:…</code>-URL anlegen — Chrome/React
            zerstören Drag-&amp;-Drop oft.
          </p>
        )}

        <details className="rounded-md border border-zinc-200 bg-zinc-50/80 px-3 py-2">
          <summary className="text-xs font-medium text-zinc-700 cursor-pointer select-none">
            Alternative ohne Bookmarklet: Text kopieren &amp; einfügen
          </summary>
          <div className="mt-2 space-y-2">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Job-Seite → Text markieren (Strg/Cmd+A oder Auswahl) → kopieren → hier einfügen
              oder „Zwischenablage importieren“.
            </p>
            <textarea
              rows={4}
              value={pasteDraft}
              onChange={(e) => setPasteDraft(e.target.value)}
              placeholder="Stellenbeschreibung hier einfügen …"
              className={`${textareaClass} min-h-[88px] text-xs`}
            />
            <button
              type="button"
              disabled={importing || !pasteDraft.trim()}
              onClick={() => void handlePasteDraftImport()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" aria-hidden />
              Eingefügten Text importieren
            </button>
          </div>
        </details>

        {import.meta.env.DEV && (
          <p className="text-[10px] text-zinc-400 font-mono leading-relaxed break-all">
            Dev: type={ATS_POOL_JOB_MESSAGE_TYPE} · storage={ATS_POOL_BOOKMARKLET_STORAGE_KEY} ·
            href-len={bookmarkletHref.length}
          </p>
        )}

        {bookmarkletHref && (
          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer select-none">Bookmarklet-Code anzeigen (Fallback)</summary>
            <textarea
              readOnly
              rows={3}
              value={bookmarkletHref}
              className={`${textareaClass} mt-2 font-mono text-[10px] min-h-[72px]`}
              onFocus={(e) => e.currentTarget.select()}
            />
          </details>
        )}
      </section>

      {(importMissBanner || clipboardHint) && (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 space-y-2"
        >
          {importMissBanner && (
            <p>
              Kein Import empfangen — vermutlich altes/kaputtes Lesezeichen (React hatte{' '}
              <code className="text-xs">javascript:</code> blockiert) oder die Pool-Seite statt
              des Bookmarklets gespeichert.
            </p>
          )}
          <p className="text-xs leading-relaxed">
            Bitte Bookmarklet neu anlegen („Code kopieren“) oder Job-Text kopieren und
            „Zwischenablage importieren“ nutzen.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyBookmarkletCode()}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden />
              Code kopieren
            </button>
            <button
              type="button"
              onClick={() => void handleClipboardImportClick()}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
            >
              <ClipboardPaste className="w-3.5 h-3.5" aria-hidden />
              Zwischenablage importieren
            </button>
            <button
              type="button"
              onClick={() => {
                setImportMissBanner(false)
                setClipboardHint(false)
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">Typ</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          >
            <option value="Alle">Alle</option>
            {JOB_POOL_APPLICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          >
            <option value="Alle">Alle</option>
            {JOB_POOL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs text-zinc-400 tabular-nums">
          {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'}
        </span>
      </div>

      {(error || notice || importing) && (
        <div className="space-y-2">
          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </div>
          )}
          {importing && (
            <div
              role="status"
              className="rounded-md bg-sky-50 border border-sky-200 px-3 py-2 text-sm text-sky-900 inline-flex items-center gap-2"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
              Stelle wird gesammelt …
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-900"
            >
              {notice}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <section className="lg:col-span-2 space-y-3" aria-label="Pool-Liste">
          {loading ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 flex items-center justify-center gap-2 text-sm text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Lade Pool …
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center space-y-2">
              <Inbox className="w-8 h-8 text-zinc-300 mx-auto" aria-hidden />
              <p className="text-sm font-medium text-zinc-700">Noch keine Einträge</p>
              <p className="text-xs text-zinc-500">
                Manuell anlegen (oben rechts) oder per Bookmarklet von einer Job-Seite sammeln.
              </p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {entries.map((entry) => {
                const active = entry.id === selectedId
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => selectEntry(entry)}
                      className={[
                        'w-full text-left rounded-lg border p-3.5 transition-colors',
                        active
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-900',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <p
                            className={[
                              'text-[11px] font-medium uppercase tracking-[0.12em] truncate',
                              active ? 'text-zinc-400' : 'text-zinc-400',
                            ].join(' ')}
                          >
                            {entry.company_name || 'Ohne Firma'}
                          </p>
                          <p className="text-sm font-semibold leading-snug truncate">
                            {entry.application_type === 'initiative'
                              ? entry.title?.trim() || 'Initiativbewerbung'
                              : entry.title?.trim() || 'Ohne Titel'}
                          </p>
                        </div>
                        {!active && <StatusBadge status={entry.status} />}
                        {active && (
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-zinc-700 text-zinc-100">
                            {STATUS_LABEL[entry.status]}
                          </span>
                        )}
                      </div>
                      <div
                        className={[
                          'mt-2.5 flex items-center justify-between gap-2 text-[11px]',
                          active ? 'text-zinc-400' : 'text-zinc-500',
                        ].join(' ')}
                      >
                        <span>{TYPE_LABEL[entry.application_type]}</span>
                        <time dateTime={entry.created_at}>{formatDate(entry.created_at)}</time>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section
          ref={formSectionRef}
          className="lg:col-span-3 rounded-lg border border-zinc-200 bg-white p-5 md:p-6 shadow-sm"
          aria-label={isEditing ? 'Eintrag bearbeiten' : 'Manuell anlegen'}
        >
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  {isEditing ? 'Eintrag bearbeiten' : 'Manuell anlegen'}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {isEditing
                    ? 'Änderungen speichern oder löschen.'
                    : 'Felder ausfüllen und anlegen — ideal für viele Einträge hintereinander.'}
                </p>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
                  title="Neuen Eintrag manuell anlegen"
                >
                  <X className="w-4 h-4" aria-hidden />
                  <span className="sr-only">Neuen Eintrag manuell anlegen</span>
                </button>
              )}
            </div>

            <div
              role="group"
              aria-label="Bewerbungstyp"
              className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-zinc-50"
            >
              {JOB_POOL_APPLICATION_TYPES.map((t) => {
                const active = form.application_type === t
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={saving}
                    onClick={() => setApplicationType(t)}
                    className={[
                      'rounded-[5px] px-3.5 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900',
                    ].join(' ')}
                  >
                    {TYPE_LABEL[t]}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-700">Unternehmen *</span>
                <input
                  ref={companyInputRef}
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => patchForm('company_name', e.target.value)}
                  disabled={saving}
                  placeholder="Firma / Organisation"
                  className={inputClass}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-700">
                  Titel {form.application_type === 'regular' ? '*' : ''}
                  {form.application_type === 'initiative' && (
                    <span className="text-zinc-400 font-normal"> (optional)</span>
                  )}
                </span>
                <input
                  type="text"
                  required={form.application_type === 'regular'}
                  value={form.title}
                  onChange={(e) => patchForm('title', e.target.value)}
                  disabled={saving}
                  placeholder={
                    isInitiative ? 'z. B. Initiativ – Data Engineering' : 'Stellenbezeichnung'
                  }
                  className={inputClass}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-700">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => patchForm('status', e.target.value as JobPoolStatus)}
                  disabled={saving}
                  className={inputClass}
                >
                  {JOB_POOL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!isInitiative && (
              <>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-zinc-700">
                    Stellenbeschreibung{' '}
                    <span className="text-zinc-400 font-normal">(optional)</span>
                  </span>
                  <textarea
                    rows={8}
                    value={form.job_description}
                    onChange={(e) => patchForm('job_description', e.target.value)}
                    disabled={saving}
                    placeholder="Rohtext der Stellenanzeige …"
                    className={`${textareaClass} min-h-[140px]`}
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-zinc-700">
                      Link / URL <span className="text-zinc-400 font-normal">(optional)</span>
                    </span>
                    <input
                      type="url"
                      value={form.source_url}
                      onChange={(e) => patchForm('source_url', e.target.value)}
                      disabled={saving}
                      placeholder="https://…"
                      className={inputClass}
                    />
                  </label>
                </div>
              </>
            )}

            {isInitiative && (
              <>
                {form.job_description.trim() && (
                  <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5 space-y-2">
                    <p className="text-xs text-sky-900 leading-relaxed">
                      Stellenbeschreibung liegt noch vor ({form.job_description.trim().length}{' '}
                      Zeichen). Fehlende Unternehmensinfos, Zielbereich, Kontakt (in Notizen) und
                      Firmen-URL (unter Weitere Links) können daraus übernommen werden.
                    </p>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => applyJobTextExtract(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-950 hover:bg-sky-100 disabled:opacity-50 transition-colors"
                    >
                      Infos aus Stellenbeschreibung übernehmen
                    </button>
                  </div>
                )}

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-zinc-700">
                    Unternehmensinfos{' '}
                    <span className="text-zinc-400 font-normal">(optional)</span>
                  </span>
                  <textarea
                    rows={5}
                    value={form.company_info}
                    onChange={(e) => patchForm('company_info', e.target.value)}
                    disabled={saving}
                    placeholder="Branche, Standort, Notizen zum Unternehmen …"
                    className={`${textareaClass} min-h-[100px]`}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-zinc-700">
                    Zielbereich / Fokus{' '}
                    <span className="text-zinc-400 font-normal">(optional)</span>
                  </span>
                  <textarea
                    rows={4}
                    value={form.target_notes}
                    onChange={(e) => patchForm('target_notes', e.target.value)}
                    disabled={saving}
                    placeholder="Wofür initiativ bewerben? Team, Rolle, Stichworte …"
                    className={`${textareaClass} min-h-[90px]`}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-zinc-700">
                    Quellen-URL (Stelle){' '}
                    <span className="text-zinc-400 font-normal">(optional)</span>
                  </span>
                  <input
                    type="url"
                    value={form.source_url}
                    onChange={(e) => patchForm('source_url', e.target.value)}
                    disabled={saving}
                    placeholder="https://de.indeed.com/…"
                    className={inputClass}
                  />
                  <span className="text-[11px] text-zinc-400">
                    Job-URL bleibt hier. Firmen-Website landet unter „Weitere Links“.
                  </span>
                </label>

                <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-white border border-zinc-200 p-2 text-zinc-700">
                      <FileText className="w-4 h-4" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1 flex-1">
                      <p className="text-sm font-medium text-zinc-800">WBS-Bescheinigung (PDF)</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Optional. Speicherung in ats-documents unter{' '}
                        <code className="text-[11px]">{'{userId}/wbs/{id}.pdf'}</code>.
                      </p>
                      {pendingWbsFile && (
                        <p className="text-xs text-amber-800">
                          Wartend: {pendingWbsFile.name} — wird beim Speichern hochgeladen.
                        </p>
                      )}
                      {selected?.wbs_certificate_path && !pendingWbsFile && (
                        <p className="text-xs text-zinc-600 truncate">
                          Gespeichert: {selected.wbs_certificate_path}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={wbsInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(e) => {
                        void handleWbsFile(e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                    <button
                      type="button"
                      disabled={saving || wbsBusy}
                      onClick={() => wbsInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                    >
                      {wbsBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Upload className="w-3.5 h-3.5" aria-hidden />
                      )}
                      PDF wählen
                    </button>
                    {wbsUrl && (
                      <a
                        href={wbsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                        Öffnen
                      </a>
                    )}
                    {(selected?.wbs_certificate_path || pendingWbsFile) && (
                      <button
                        type="button"
                        disabled={saving || wbsBusy}
                        onClick={() => void handleRemoveWbs()}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                        Entfernen
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">
                Weitere Links <span className="text-zinc-400 font-normal">(eine URL pro Zeile)</span>
              </span>
              <textarea
                rows={2}
                value={form.linksText}
                onChange={(e) => patchForm('linksText', e.target.value)}
                disabled={saving}
                placeholder={'Unternehmen | https://firma.de\nKarriere | https://…'}
                className={textareaClass}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700">
                Notizen <span className="text-zinc-400 font-normal">(optional)</span>
              </span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => patchForm('notes', e.target.value)}
                disabled={saving}
                placeholder={
                  isInitiative
                    ? 'Kontakt: …\nE-Mail: …\nInterne Merker …'
                    : 'Interne Merker …'
                }
                className={textareaClass}
              />
            </label>

            {isEditing && selected?.application_id && (
              <p className="text-xs text-zinc-500">
                Verknüpfte Bewerbung:{' '}
                <a
                  href={`/admin/applications/${selected.application_id}`}
                  className="underline underline-offset-2 hover:text-zinc-800"
                >
                  öffnen
                </a>
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-zinc-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Speichert …
                  </>
                ) : isEditing ? (
                  'Änderungen speichern'
                ) : (
                  <>
                    <Plus className="w-4 h-4" aria-hidden />
                    Anlegen
                  </>
                )}
              </button>

              {isEditing && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleDelete()}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                  Löschen
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
