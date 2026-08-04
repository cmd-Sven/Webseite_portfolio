import { useCallback, useEffect, useState } from 'react'
import { Building2, ExternalLink, Inbox, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { createJobPoolEntry } from '../../lib/atsPoolApi'
import {
  listCompanySuggestions,
  listJobSuggestions,
  updateCompanySuggestionStatus,
  updateJobSuggestionStatus,
} from '../../lib/atsSuggestionsApi'
import type {
  CompanySuggestionRow,
  CompanySuggestionStatus,
  JobSuggestionRow,
} from '../../types/ats'

function formatDate(iso: string): string {
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

const JOB_STATUS_LABEL: Record<string, string> = {
  neu: 'Neu',
  uebernommen: 'Übernommen',
  abgelehnt: 'Abgelehnt',
}

const COMPANY_STATUS_LABEL: Record<CompanySuggestionStatus, string> = {
  neu: 'Neu',
  gesehen: 'Gesehen',
  archiviert: 'Archiviert',
}

export function AdminSuggestionsPage() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobSuggestionRow[]>([])
  const [companies, setCompanies] = useState<CompanySuggestionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [jobRes, companyRes] = await Promise.all([
      listJobSuggestions(),
      listCompanySuggestions(),
    ])
    if (jobRes.error || companyRes.error) {
      setError(jobRes.error || companyRes.error)
      setLoading(false)
      return
    }
    setJobs(jobRes.data)
    setCompanies(companyRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

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
      setNotice(poolError || 'Übernahme in Pool fehlgeschlagen')
      return
    }
    const { error: updError } = await updateJobSuggestionStatus(
      suggestion.id,
      'uebernommen',
      pool.id,
    )
    setBusyId(null)
    if (updError) {
      setNotice(updError)
      return
    }
    setNotice(`„${suggestion.title}“ in den Stellen-Pool übernommen.`)
    await reload()
  }

  async function rejectJob(id: string) {
    setBusyId(id)
    await updateJobSuggestionStatus(id, 'abgelehnt')
    setBusyId(null)
    await reload()
  }

  async function setCompanyStatus(id: string, status: CompanySuggestionStatus) {
    setBusyId(id)
    await updateCompanySuggestionStatus(id, status)
    setBusyId(null)
    await reload()
  }

  const openJobs = jobs.filter((j) => j.status === 'neu')
  const otherJobs = jobs.filter((j) => j.status !== 'neu')
  const openCompanies = companies.filter((c) => c.status === 'neu')
  const otherCompanies = companies.filter((c) => c.status !== 'neu')

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-medium">
          Inbox
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Vorschläge</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Stellen und interessante Unternehmen von Monitor-Usern — getrennt vom Pool.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {loading && (
        <p className="inline-flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Laden …
        </p>
      )}

      {!loading && (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-zinc-500" aria-hidden />
              <h2 className="text-sm font-semibold text-zinc-900">
                Stellen-Vorschläge
              </h2>
              <span className="text-xs text-zinc-400 tabular-nums">{openJobs.length} neu</span>
            </div>
            {openJobs.length === 0 ? (
              <p className="text-sm text-zinc-500">Keine neuen Stellen-Vorschläge.</p>
            ) : (
              <ul className="space-y-2">
                {openJobs.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                          {item.company_name || 'Firma'}
                        </p>
                        <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                      </div>
                      <span className="text-[11px] text-zinc-400 shrink-0">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900"
                      >
                        <ExternalLink className="w-3 h-3" aria-hidden />
                        Stellenlink
                      </a>
                    )}
                    {item.notes?.trim() && (
                      <p className="text-sm text-zinc-600 whitespace-pre-wrap">{item.notes}</p>
                    )}
                    {item.job_description_raw?.trim() && (
                      <details className="text-xs text-zinc-500">
                        <summary className="cursor-pointer hover:text-zinc-700">Rohtext</summary>
                        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-2 font-mono">
                          {item.job_description_raw}
                        </pre>
                      </details>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void adoptJob(item)}
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        In Pool übernehmen
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void rejectJob(item.id)}
                        className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Ablehnen
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {otherJobs.length > 0 && (
              <details className="text-sm text-zinc-500">
                <summary className="cursor-pointer hover:text-zinc-700">
                  Erledigte Stellen-Vorschläge ({otherJobs.length})
                </summary>
                <ul className="mt-2 space-y-1">
                  {otherJobs.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2 text-xs">
                      <span className="truncate">
                        {item.company_name} — {item.title}
                      </span>
                      <span>{JOB_STATUS_LABEL[item.status] ?? item.status}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-500" aria-hidden />
              <h2 className="text-sm font-semibold text-zinc-900">
                Interessante Unternehmen
              </h2>
              <span className="text-xs text-zinc-400 tabular-nums">
                {openCompanies.length} neu
              </span>
            </div>
            {openCompanies.length === 0 ? (
              <p className="text-sm text-zinc-500">Keine neuen Unternehmens-Vorschläge.</p>
            ) : (
              <ul className="space-y-2">
                {openCompanies.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">
                          {item.company_name}
                        </p>
                        <a
                          href={item.company_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-xs text-zinc-600 hover:text-zinc-900 break-all"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" aria-hidden />
                          {item.company_url}
                        </a>
                      </div>
                      <span className="text-[11px] text-zinc-400 shrink-0">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    {item.notes?.trim() && (
                      <p className="text-sm text-zinc-600 whitespace-pre-wrap">{item.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void setCompanyStatus(item.id, 'gesehen')}
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Als gesehen markieren
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void setCompanyStatus(item.id, 'archiviert')}
                        className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Archivieren
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {otherCompanies.length > 0 && (
              <details className="text-sm text-zinc-500">
                <summary className="cursor-pointer hover:text-zinc-700">
                  Erledigte Unternehmen ({otherCompanies.length})
                </summary>
                <ul className="mt-2 space-y-1">
                  {otherCompanies.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2 text-xs">
                      <span className="truncate">{item.company_name}</span>
                      <span>{COMPANY_STATUS_LABEL[item.status]}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </>
      )}
    </div>
  )
}
