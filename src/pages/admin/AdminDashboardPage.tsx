import { useEffect, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Loader2, Plus } from 'lucide-react'
import { listApplications, markAppliedAndDownloadCalendar } from '../../lib/atsApi'
import {
  APPLICATION_STATUSES,
  type ApplicationRow,
  type ApplicationStatus,
} from '../../types/ats'

type StatusFilter = 'Alle' | ApplicationStatus

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  Gefunden: 'bg-zinc-100 text-zinc-700',
  'In Bearbeitung': 'bg-sky-50 text-sky-800',
  Beworben: 'bg-amber-50 text-amber-800',
  Interview: 'bg-emerald-50 text-emerald-800',
  Absage: 'bg-red-50 text-red-800',
}

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

function formatMatchScore(score: number | null): string | null {
  if (score == null || Number.isNaN(score)) return null
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score)
  return `${pct}%`
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        STATUS_BADGE[status] ?? 'bg-zinc-100 text-zinc-700',
      ].join(' ')}
    >
      {status}
    </span>
  )
}

function ApplicationCard({
  application,
  onUpdated,
}: {
  application: ApplicationRow
  onUpdated: (next: ApplicationRow) => void
}) {
  const match = formatMatchScore(application.match_score)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const showMarkApplied =
    application.status !== 'Beworben' &&
    application.status !== 'Interview' &&
    application.status !== 'Absage'

  async function handleMarkApplied(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setBusy(true)
    setActionError(null)
    const { data, error } = await markAppliedAndDownloadCalendar(application)
    setBusy(false)
    if (error || !data) {
      setActionError(error || 'Aktion fehlgeschlagen')
      if (data) onUpdated(data)
      return
    }
    onUpdated(data)
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300">
      <Link
        to={`/admin/applications/${application.id}`}
        className="group block p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-t-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-400 truncate">
              {application.company_name || 'Unbekannte Firma'}
            </p>
            <h3 className="text-sm font-semibold text-zinc-900 leading-snug group-hover:text-zinc-700 truncate">
              {application.job_title || 'Ohne Titel'}
            </h3>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
          <time dateTime={application.applied_at ?? application.created_at}>
            {formatDate(application.applied_at ?? application.created_at)}
          </time>
          {match ? (
            <span className="tabular-nums text-zinc-700">
              Match <span className="font-medium">{match}</span>
            </span>
          ) : (
            <span className="text-zinc-400">Kein Score</span>
          )}
        </div>
      </Link>

      {showMarkApplied && (
        <div className="border-t border-zinc-100 px-3 py-2">
          <button
            type="button"
            disabled={busy}
            onClick={(e) => void handleMarkApplied(e)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-60 transition-colors"
            title="Als beworben markieren & Apple-Kalender-Termine (.ics) herunterladen"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
            ) : (
              <CalendarPlus className="w-3.5 h-3.5" aria-hidden />
            )}
            Beworben + .ics
          </button>
          {actionError && (
            <p role="alert" className="mt-1 text-[11px] text-red-700">
              {actionError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminDashboardPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('Alle')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    void listApplications().then(({ data, error: fetchError }) => {
      if (cancelled) return
      if (fetchError) {
        setError(fetchError)
        setApplications([])
      } else {
        setApplications(data)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  function handleApplicationUpdated(next: ApplicationRow) {
    setApplications((prev) => prev.map((app) => (app.id === next.id ? next : app)))
  }

  const filtered =
    filter === 'Alle'
      ? applications
      : applications.filter((app) => app.status === filter)

  const counts = APPLICATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = applications.filter((a) => a.status === status).length
      return acc
    },
    {} as Record<ApplicationStatus, number>,
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Bewerbungen</h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Alle erfassten Stellen — Klick öffnet die Detailansicht.
          </p>
        </div>
        {!loading && applications.length > 0 && (
          <p className="text-xs text-zinc-400 tabular-nums shrink-0">
            {filtered.length}
            {filter !== 'Alle' ? ` von ${applications.length}` : ''}{' '}
            {filtered.length === 1 ? 'Bewerbung' : 'Bewerbungen'}
          </p>
        )}
      </div>

      {!loading && !error && applications.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Statusfilter">
          <FilterChip
            label="Alle"
            active={filter === 'Alle'}
            count={applications.length}
            onClick={() => setFilter('Alle')}
          />
          {APPLICATION_STATUSES.map((status) => (
            <FilterChip
              key={status}
              label={status}
              active={filter === status}
              count={counts[status]}
              onClick={() => setFilter(status)}
            />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Bewerbungen werden geladen…
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Bewerbungen konnten nicht geladen werden: {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white/70 px-6 py-14 text-center space-y-3">
          <p className="text-sm font-medium text-zinc-700">Noch keine Bewerbungen</p>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Erfasse eine Stellenanzeige — sie erscheint hier als Karte mit Status und Match-Score.
          </p>
          <Link
            to="/admin/new"
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm text-white hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Neue Bewerbung
          </Link>
        </div>
      )}

      {!loading && !error && applications.length > 0 && filtered.length === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-zinc-500">
            Keine Bewerbungen mit Status „{filter}“.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
          {filtered.map((app) => (
            <li key={app.id}>
              <ApplicationCard application={app} onUpdated={handleApplicationUpdated} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string
  active: boolean
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors',
        active
          ? 'bg-zinc-900 text-white'
          : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900',
      ].join(' ')}
    >
      {label}
      <span
        className={[
          'tabular-nums',
          active ? 'text-zinc-300' : 'text-zinc-400',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  )
}
