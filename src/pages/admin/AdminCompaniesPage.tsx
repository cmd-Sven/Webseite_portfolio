import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createJobPoolEntry } from '../../lib/atsPoolApi'
import {
  COMPANY_EVENT_LABELS,
  createInterestingCompany,
  listCompanyEvents,
  listInterestingCompaniesWithBadges,
} from '../../lib/atsCompaniesApi'
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

export function AdminCompaniesPage() {
  const { user } = useAuth()
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
    if (!selected) {
      setEvents([])
      return
    }
    let active = true
    setEventsLoading(true)
    void listCompanyEvents(selected.id).then((res) => {
      if (!active) return
      setEvents(res.data)
      setEventsLoading(false)
    })
    return () => {
      active = false
    }
  }, [selected])

  const openJobs = useMemo(() => jobs.filter((j) => j.status === 'neu'), [jobs])

  async function handleAddCompany(e: FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    setBusyId('add')
    setNotice(null)
    const { error: err } = await createInterestingCompany({
      user_id: user.id,
      name: addName,
      website_url: addUrl,
      notes: addNotes,
    })
    setBusyId(null)
    if (err) {
      setNotice(err)
      return
    }
    setAddName('')
    setAddUrl('')
    setAddNotes('')
    setShowAdd(false)
    setNotice('Unternehmen angelegt.')
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
            Aus Pool, Bewerbungen, Monitor-Vorschlägen und manuellen Einträgen — inkl. History.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus className="w-4 h-4" aria-hidden />
          Manuell anlegen
        </button>
      </div>

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
          className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold">Unternehmen manuell anlegen</h2>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Name *</span>
            <input
              required
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Website</span>
            <input
              type="url"
              value={addUrl}
              onChange={(e) => setAddUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Notiz</span>
            <textarea
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
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
              <ul className="space-y-2">
                {pendingCompanies.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white border border-amber-100 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{item.company_name}</p>
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
                        <p className="text-sm font-semibold text-zinc-900 truncate">{c.name}</p>
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
            aria-label={`History ${selected.name}`}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">Unternehmen</p>
                <h2 className="mt-1 text-lg font-semibold truncate">{selected.name}</h2>
                {selected.website_url && (
                  <a
                    href={selected.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 break-all"
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
