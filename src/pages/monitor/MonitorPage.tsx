import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Building2, ExternalLink, LogOut, Plus, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listApplications } from '../../lib/atsApi'
import { listJobPoolEntries } from '../../lib/atsPoolApi'
import {
  createCompanySuggestion,
  createJobSuggestion,
} from '../../lib/atsSuggestionsApi'
import type { ApplicationRow, JobPoolRow } from '../../types/ats'

type MonitorTab = 'offen' | 'verschickt' | 'rueckmeldungen'
type SuggestMode = null | 'job' | 'company'

const STATUS_BADGE: Record<string, string> = {
  Gefunden: 'bg-zinc-100 text-zinc-700',
  'In Bearbeitung': 'bg-sky-50 text-sky-800',
  Beworben: 'bg-amber-50 text-amber-800',
  Interview: 'bg-emerald-50 text-emerald-800',
  Absage: 'bg-red-50 text-red-800',
  gesammelt: 'bg-zinc-100 text-zinc-700',
  geplant: 'bg-sky-50 text-sky-800',
  in_arbeit: 'bg-amber-50 text-amber-800',
  erledigt: 'bg-emerald-50 text-emerald-800',
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

function Badge({ label }: { label: string }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        STATUS_BADGE[label] ?? 'bg-zinc-100 text-zinc-700',
      ].join(' ')}
    >
      {label}
    </span>
  )
}

export function MonitorPage() {
  const { user, signOut } = useAuth()
  const [tab, setTab] = useState<MonitorTab>('offen')
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [pool, setPool] = useState<JobPoolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suggestMode, setSuggestMode] = useState<SuggestMode>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Job form
  const [jobTitle, setJobTitle] = useState('')
  const [jobCompany, setJobCompany] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [jobNotes, setJobNotes] = useState('')
  const [jobRaw, setJobRaw] = useState('')

  // Company form
  const [companyName, setCompanyName] = useState('')
  const [companyUrl, setCompanyUrl] = useState('')
  const [companyNotes, setCompanyNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.body.style.overflowY = 'auto'
    return () => {
      document.body.style.overflowY = ''
    }
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      const [appsRes, poolRes] = await Promise.all([
        listApplications(),
        listJobPoolEntries(),
      ])
      if (!active) return
      if (appsRes.error || poolRes.error) {
        setError(appsRes.error || poolRes.error)
        setLoading(false)
        return
      }
      setApplications(appsRes.data)
      setPool(poolRes.data)
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const openPool = useMemo(
    () =>
      pool.filter((p) => p.status === 'gesammelt' || p.status === 'geplant'),
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

  async function handleLogout() {
    await signOut()
  }

  async function submitJob(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setNotice(null)
    const { error: err } = await createJobSuggestion({
      title: jobTitle,
      company_name: jobCompany,
      source_url: jobUrl,
      notes: jobNotes,
      job_description_raw: jobRaw,
    })
    setSubmitting(false)
    if (err) {
      setNotice(err)
      return
    }
    setJobTitle('')
    setJobCompany('')
    setJobUrl('')
    setJobNotes('')
    setJobRaw('')
    setSuggestMode(null)
    setNotice('Stelle vorgeschlagen — Admin sieht sie in der Inbox.')
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
    setSuggestMode(null)
    setNotice('Unternehmen vorgeschlagen — Admin sieht es unter „Interessante Unternehmen“.')
  }

  const tabs: Array<{ id: MonitorTab; label: string; count: number }> = [
    { id: 'offen', label: 'Offen / geplant', count: openPool.length + openApps.length },
    { id: 'verschickt', label: 'Verschickt', count: sent.length },
    { id: 'rueckmeldungen', label: 'Rückmeldungen', count: feedback.length },
  ]

  return (
    <div className="admin-shell min-h-screen bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-medium">
              Personal ATS
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Monitor</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Nur lesen — Bewerbungsstand &amp; Vorschläge.
            </p>
          </div>
          <div className="text-right space-y-2">
            <p className="text-xs text-zinc-500 truncate max-w-[12rem]" title={user?.email ?? undefined}>
              {user?.email}
            </p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden />
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSuggestMode('job')
              setNotice(null)
            }}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Stelle vorschlagen
          </button>
          <button
            type="button"
            onClick={() => {
              setSuggestMode('company')
              setNotice(null)
            }}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            <Building2 className="w-4 h-4" aria-hidden />
            Unternehmen vorschlagen
          </button>
        </div>

        {notice && (
          <div
            role="status"
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
          >
            {notice}
          </div>
        )}

        {suggestMode === 'job' && (
          <form
            onSubmit={(e) => void submitJob(e)}
            className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Stelle vorschlagen</h2>
              <button
                type="button"
                className="text-xs text-zinc-500 hover:text-zinc-800"
                onClick={() => setSuggestMode(null)}
              >
                Schließen
              </button>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Titel *</span>
              <input
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Firma *</span>
              <input
                required
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Link</span>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Notiz</span>
              <textarea
                value={jobNotes}
                onChange={(e) => setJobNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Rohtext (optional)</span>
              <textarea
                value={jobRaw}
                onChange={(e) => setJobRaw(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-mono"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Send className="w-4 h-4" aria-hidden />
              {submitting ? 'Senden …' : 'Vorschlag senden'}
            </button>
          </form>
        )}

        {suggestMode === 'company' && (
          <form
            onSubmit={(e) => void submitCompany(e)}
            className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Unternehmen vorschlagen</h2>
              <button
                type="button"
                className="text-xs text-zinc-500 hover:text-zinc-800"
                onClick={() => setSuggestMode(null)}
              >
                Schließen
              </button>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Name *</span>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Unternehmens-Link *</span>
              <input
                required
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Notiz (optional)</span>
              <textarea
                value={companyNotes}
                onChange={(e) => setCompanyNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Send className="w-4 h-4" aria-hidden />
              {submitting ? 'Senden …' : 'Vorschlag senden'}
            </button>
          </form>
        )}

        <div className="flex gap-1 border-b border-zinc-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
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

        {loading && (
          <p className="text-sm text-zinc-500">Daten werden geladen …</p>
        )}
        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && tab === 'offen' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-2">
                Stellen-Pool
              </h2>
              {openPool.length === 0 ? (
                <p className="text-sm text-zinc-500">Keine offenen Pool-Einträge.</p>
              ) : (
                <ul className="space-y-2">
                  {openPool.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-zinc-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400 truncate">
                            {item.company_name || 'Firma'}
                          </p>
                          <p className="text-sm font-semibold text-zinc-900 truncate">
                            {item.title || 'Ohne Titel'}
                          </p>
                        </div>
                        <Badge label={item.status} />
                      </div>
                      <p className="mt-3 text-xs text-zinc-500">
                        Angelegt {formatDate(item.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400 mb-2">
                Bewerbungen in Arbeit
              </h2>
              {openApps.length === 0 ? (
                <p className="text-sm text-zinc-500">Keine offenen Bewerbungen.</p>
              ) : (
                <ul className="space-y-2">
                  {openApps.map((app) => (
                    <li
                      key={app.id}
                      className="rounded-lg border border-zinc-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400 truncate">
                            {app.company_name}
                          </p>
                          <p className="text-sm font-semibold text-zinc-900 truncate">
                            {app.job_title}
                          </p>
                        </div>
                        <Badge label={app.status} />
                      </div>
                      <p className="mt-3 text-xs text-zinc-500">
                        Angelegt {formatDate(app.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {!loading && !error && tab === 'verschickt' && (
          <section>
            {sent.length === 0 ? (
              <p className="text-sm text-zinc-500">Noch keine verschickten Bewerbungen.</p>
            ) : (
              <ul className="space-y-2">
                {sent.map((app) => (
                  <li
                    key={app.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-400 truncate">
                          {app.company_name}
                        </p>
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {app.job_title}
                        </p>
                      </div>
                      <Badge label={app.status} />
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">
                      Beworben am {formatDate(app.applied_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {!loading && !error && tab === 'rueckmeldungen' && (
          <section>
            {feedback.length === 0 ? (
              <p className="text-sm text-zinc-500">Noch keine Rückmeldungen.</p>
            ) : (
              <ul className="space-y-2">
                {feedback.map((app) => (
                  <li
                    key={app.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-400 truncate">
                          {app.company_name}
                        </p>
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {app.job_title}
                        </p>
                      </div>
                      <Badge label={app.status} />
                    </div>
                    {app.feedback_at && (
                      <p className="text-xs text-zinc-500">
                        Rückmeldung {formatDate(app.feedback_at)}
                      </p>
                    )}
                    {app.feedback_notes?.trim() ? (
                      <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                        {app.feedback_notes}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400">Kein Feedback-Text.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="text-[11px] text-zinc-400 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" aria-hidden />
          Schreiben, Generieren und Planen nur für Admin.
        </p>
      </main>
    </div>
  )
}
