import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Sunrise,
  Sunset,
} from 'lucide-react'
import { ManualSentDialog } from '../../components/admin/ManualSentDialog'
import { useAuth } from '../../context/AuthContext'
import {
  ensureApplicationForPool,
  getApplicationById,
} from '../../lib/atsApi'
import { downloadPlanBatchIcal } from '../../lib/atsIcal'
import { openApplicationMailto } from '../../lib/atsMail'
import {
  addDaysLocal,
  applySlotMove,
  createPlanForPoolEntries,
  getTodayOrNextSlots,
  listAllPlanSlots,
  listPoolEntriesForPlanning,
  persistPlanSlotSchedule,
  rebuildOpenPlanSchedule,
  todayLocalDateString,
  type MoveSlotAction,
  type PlanSlotWithPool,
} from '../../lib/atsPlanApi'
import { updateJobPoolEntry } from '../../lib/atsPoolApi'
import type { ApplicationRow, JobPoolApplicationType, JobPoolRow } from '../../types/ats'

const TYPE_LABEL: Record<JobPoolApplicationType, string> = {
  regular: 'Regulär',
  initiative: 'Initiativ',
}

const SLOT_STATUS_LABEL: Record<string, string> = {
  offen: 'Offen',
  zugewiesen: 'Zugewiesen',
  erledigt: 'Erledigt',
  uebersprungen: 'Übersprungen',
}

function formatPlanDate(planDate: string): string {
  try {
    const [y, m, d] = planDate.split('-').map(Number)
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(y, (m ?? 1) - 1, d ?? 1))
  } catch {
    return planDate
  }
}

function defaultStartDate(): string {
  return todayLocalDateStringFromOffset(1)
}

function todayLocalDateStringFromOffset(days: number): string {
  const d = addDaysLocal(new Date(), days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function poolTitle(entry: JobPoolRow): string {
  if (entry.application_type === 'initiative') {
    return entry.title?.trim() || 'Initiativbewerbung'
  }
  return entry.title?.trim() || 'Ohne Titel'
}

function SlotActions({
  pool,
  busyAction,
  onTypeToggle,
}: {
  pool: JobPoolRow
  busyAction: boolean
  onTypeToggle: (poolId: string, nextType: JobPoolApplicationType) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div
        role="group"
        aria-label="Bewerbungstyp"
        className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-white"
      >
        {(['regular', 'initiative'] as const).map((t) => {
          const active = pool.application_type === t
          return (
            <button
              key={t}
              type="button"
              disabled={busyAction}
              onClick={() => onTypeToggle(pool.id, t)}
              className={[
                'rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900',
              ].join(' ')}
            >
              {TYPE_LABEL[t]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AdminPlanPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [poolCandidates, setPoolCandidates] = useState<JobPoolRow[]>([])
  const [slots, setSlots] = useState<PlanSlotWithPool[]>([])
  const [focusSlots, setFocusSlots] = useState<PlanSlotWithPool[]>([])
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [busyAction, setBusyAction] = useState(false)
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [manualSentApp, setManualSentApp] = useState<ApplicationRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [poolRes, slotsRes, focusRes] = await Promise.all([
      listPoolEntriesForPlanning(),
      listAllPlanSlots(),
      getTodayOrNextSlots(),
    ])

    if (poolRes.error) setError(poolRes.error)
    if (slotsRes.error) setError((prev) => prev || slotsRes.error)
    if (focusRes.error) setError((prev) => prev || focusRes.error)

    setPoolCandidates(poolRes.data)
    setSlots(slotsRes.data)
    setFocusSlots(focusRes.data)
    setSelectedIds(new Set(poolRes.data.map((e) => e.id)))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const today = todayLocalDateString()

  const upcomingSlots = useMemo(
    () =>
      slots
        .filter((s) => s.status !== 'erledigt' && s.status !== 'uebersprungen')
        .sort((a, b) => {
          if (a.plan_date !== b.plan_date) return a.plan_date.localeCompare(b.plan_date)
          return a.sort_order - b.sort_order
        }),
    [slots],
  )

  const allSelected =
    poolCandidates.length > 0 && selectedIds.size === poolCandidates.length

  const isFocusToday =
    focusSlots.length > 0 && focusSlots.every((s) => s.plan_date === today)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(poolCandidates.map((e) => e.id)))
    }
  }

  async function handleCreatePlan() {
    if (!user) {
      setError('Nicht angemeldet')
      return
    }
    const ids = poolCandidates.filter((e) => selectedIds.has(e.id)).map((e) => e.id)
    if (ids.length === 0) {
      setError('Bitte mindestens eine Stelle auswählen')
      return
    }

    setCreating(true)
    setError(null)
    setNotice(null)

    const { data, error: createError } = await createPlanForPoolEntries({
      userId: user.id,
      poolIds: ids,
      startDate,
    })

    if (createError || !data) {
      setCreating(false)
      setError(createError || 'Plan konnte nicht erstellt werden')
      return
    }

    const icalEvents = data.slots.map((slot) => ({
      id: slot.id,
      plan_date: slot.plan_date,
      company_name: slot.job_pool?.company_name ?? 'Firma',
      title: slot.job_pool?.title,
      application_type: slot.job_pool?.application_type,
      source_url: slot.job_pool?.source_url,
    }))

    const { filename, error: icalError } = downloadPlanBatchIcal(icalEvents)
    setCreating(false)

    const skipHint =
      data.skippedOccupiedDates.length > 0
        ? ` (${data.skippedOccupiedDates.length} belegte Tage übersprungen)`
        : ''

    if (icalError) {
      setNotice(
        `Plan mit ${data.slots.length} Tagen erstellt${skipHint}. Kalender-Export: ${icalError}`,
      )
    } else {
      setNotice(
        `Plan mit ${data.slots.length} Tagen erstellt${skipHint}. .ics „${filename}“ heruntergeladen — in Apple Kalender importieren.`,
      )
    }

    await load()
  }

  async function persistSchedule(
    schedule: Array<{ id: string; plan_date: string; sort_order: number; label: string }>,
    successNotice: string,
  ) {
    const { error: persistError } = await persistPlanSlotSchedule(schedule)
    if (persistError) {
      setError(persistError)
      return false
    }
    setNotice(successNotice)
    await load()
    return true
  }

  async function handleSlotMove(slotId: string, action: MoveSlotAction) {
    setReschedulingId(slotId)
    setError(null)
    setNotice(null)

    const moved = applySlotMove(upcomingSlots, slotId, action, { today })
    if (!moved) {
      setReschedulingId(null)
      return
    }

    await persistSchedule(moved.schedule, moved.notice)
    setReschedulingId(null)
  }

  async function handleRescheduleAll() {
    if (upcomingSlots.length === 0) return
    setBusyAction(true)
    setError(null)
    setNotice(null)

    const schedule = rebuildOpenPlanSchedule(upcomingSlots, {
      startDate: upcomingSlots[0]?.plan_date ?? today,
    })
    await persistSchedule(
      schedule,
      'Plan neu gestaffelt (Tage mit 2+ Stellen bleiben, Rest 1/Tag).',
    )
    setBusyAction(false)
  }

  async function handleTypeToggle(
    poolId: string,
    nextType: JobPoolApplicationType,
  ) {
    setBusyAction(true)
    setError(null)
    const { error: updateError } = await updateJobPoolEntry(poolId, {
      application_type: nextType,
    })
    setBusyAction(false)
    if (updateError) {
      setError(updateError)
      return
    }
    await load()
  }

  async function handleCreateApplication(pool: JobPoolRow) {
    navigate(`/admin/new?pool=${pool.id}`)
  }

  async function handleOpenApplication(applicationId: string) {
    navigate(`/admin/applications/${applicationId}`)
  }

  async function handleOpenManualSent(pool: JobPoolRow) {
    if (!user?.id) {
      setError('Nicht angemeldet')
      return
    }

    setBusyAction(true)
    setError(null)
    setNotice(null)

    const { data: app, error: ensureError } = await ensureApplicationForPool(pool)
    setBusyAction(false)

    if (ensureError || !app) {
      setError(ensureError || 'Bewerbung konnte nicht vorbereitet werden')
      return
    }

    setManualSentApp(app)
  }

  async function handleMailto(pool: JobPoolRow) {
    if (!pool.application_id) {
      setError('Zuerst Bewerbung anlegen (oder „Manuell versendet“ nutzen).')
      return
    }
    setBusyAction(true)
    setError(null)
    const { data: app, error: loadError } = await getApplicationById(pool.application_id)
    setBusyAction(false)
    if (loadError || !app) {
      setError(loadError || 'Bewerbung nicht gefunden')
      return
    }

    const { opened, error: mailError } = openApplicationMailto({
      companyName: app.company_name,
      jobTitle: app.job_title,
      coverLetter: app.generated_cover_letter,
      candidateName: user?.email?.split('@')[0],
    })

    if (!opened || mailError) {
      setError(mailError || 'Mail-Client konnte nicht geöffnet werden')
      return
    }

    setNotice(
      'Mail-Client geöffnet. PDF (Anschreiben/CV) bitte manuell anhängen — mailto unterstützt keine Attachments.',
    )
  }

  const moveBusy = reschedulingId != null || busyAction

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Bewerbungsplan
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">
          Eine Bewerbung pro Tag planen — oder gezielt zwei an einem Tag vorziehen.
          Nach dem Verschieben wird der Restplan automatisch nachgezogen. Kalender-Sync
          über .ics-Download (Apple Kalender) — kein Live-CalDAV.
        </p>
      </div>

      {(error || notice) && (
        <div className="space-y-2">
          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
            >
              {error}
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

      {/* Heute / nächster Slot */}
      <section
        aria-labelledby="today-heading"
        className="rounded-lg border border-zinc-200 bg-white p-5 md:p-6 shadow-sm space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-zinc-100 p-2 text-zinc-700">
            <CalendarDays className="w-4 h-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 id="today-heading" className="text-sm font-semibold text-zinc-900">
              {isFocusToday
                ? focusSlots.length > 1
                  ? `Heute (${focusSlots.length} Stellen)`
                  : 'Heute'
                : 'Nächster Planungstag'}
            </h3>
            <p className="text-sm text-zinc-500">
              Typ wählen → Bewerbung mit KI erstellen → per E-Mail vorbereiten → als
              verschickt markieren.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Lade …
          </div>
        ) : focusSlots.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Kein offener Planungstag. Unten einen Plan aus dem Pool anlegen.
          </p>
        ) : (
          <div className="space-y-4">
            {focusSlots.map((focusSlot) => {
              const focusPool = focusSlot.job_pool
              if (!focusPool) return null
              return (
                <div
                  key={focusSlot.id}
                  className="space-y-4 rounded-md border border-zinc-100 bg-zinc-50/80 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-400 font-medium">
                        {formatPlanDate(focusSlot.plan_date)}
                        {focusSlots.length > 1
                          ? ` · #${focusSlot.sort_order + 1}`
                          : ''}
                        {focusSlot.label ? ` · ${focusSlot.label}` : ''}
                      </p>
                      <p className="text-base font-semibold text-zinc-900">
                        {focusPool.company_name}
                      </p>
                      <p className="text-sm text-zinc-600">{poolTitle(focusPool)}</p>
                    </div>
                    <SlotActions
                      pool={focusPool}
                      busyAction={busyAction}
                      onTypeToggle={(id, t) => void handleTypeToggle(id, t)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {focusPool.application_id ? (
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() =>
                          void handleOpenApplication(focusPool.application_id!)
                        }
                        className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" aria-hidden />
                        Bewerbung öffnen / KI
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() => void handleCreateApplication(focusPool)}
                        className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" aria-hidden />
                        Bewerbung mit KI erstellen
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busyAction || !focusPool.application_id}
                      onClick={() => void handleMailto(focusPool)}
                      className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                      title="Öffnet mailto: mit Anschreiben – PDF manuell anhängen"
                    >
                      <Mail className="w-4 h-4" aria-hidden />
                      Per E-Mail vorbereiten
                    </button>

                    <button
                      type="button"
                      disabled={busyAction || !user?.id}
                      onClick={() => void handleOpenManualSent(focusPool)}
                      className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                      title="Ohne KI-Dokumente — Versanddatum + optionale Uploads + Follow-up-.ics"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden />
                      Manuell versendet
                    </button>
                  </div>

                  {focusPool.source_url && (
                    <a
                      href={focusPool.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800"
                    >
                      Stellenanzeige öffnen
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Plan erstellen */}
      <section
        aria-labelledby="create-plan-heading"
        className="rounded-lg border border-zinc-200 bg-white p-5 md:p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 id="create-plan-heading" className="text-sm font-semibold text-zinc-900">
              Plan erstellen für Stellenangebote
            </h3>
            <p className="text-sm text-zinc-500">
              Wählt gesammelte, noch nicht verknüpfte Pool-Einträge und legt ab dem
              Startdatum je einen Slot pro Tag an. Danach unten flexibel umplanen.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            Start (Standard: morgen)
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-800 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Lade Pool …
          </div>
        ) : poolCandidates.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Keine gesammelten Stellen im Pool.{' '}
            <Link to="/admin/pool" className="underline underline-offset-2 hover:text-zinc-800">
              Zum Stellen-Pool
            </Link>
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                {allSelected ? 'Auswahl aufheben' : 'Alle auswählen'}
              </button>
              <span className="text-xs text-zinc-400 tabular-nums">
                {selectedIds.size} / {poolCandidates.length}
              </span>
            </div>

            <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-md max-h-64 overflow-y-auto">
              {poolCandidates.map((entry) => {
                const checked = selectedIds.has(entry.id)
                return (
                  <li key={entry.id}>
                    <label className="flex items-start gap-3 px-3 py-2.5 hover:bg-zinc-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(entry.id)}
                        className="mt-1 accent-zinc-900"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-zinc-900 truncate">
                          {entry.company_name}
                        </span>
                        <span className="block text-xs text-zinc-500 truncate">
                          {poolTitle(entry)} · {TYPE_LABEL[entry.application_type]}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              disabled={creating || selectedIds.size === 0}
              onClick={() => void handleCreatePlan()}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <CalendarPlus className="w-4 h-4" aria-hidden />
              )}
              Plan erstellen für {selectedIds.size || 'alle'} Stellenangebote
            </button>
            <p className="text-xs text-zinc-400">
              Nach dem Erstellen wird eine .ics mit allen Plan-Tagen heruntergeladen.
            </p>
          </>
        )}
      </section>

      {/* Geplante Tage + Umplanen */}
      <section aria-labelledby="slots-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h3 id="slots-heading" className="text-sm font-semibold text-zinc-900">
              Geplante Tage
            </h3>
            <p className="text-xs text-zinc-500 max-w-xl">
              „Auf heute“ zweimal = zwei Stellen heute; der Rest rückt automatisch nach
              (1/Tag, außer Tage die bereits 2+ haben).
            </p>
          </div>
          {upcomingSlots.length > 0 && (
            <button
              type="button"
              disabled={moveBusy}
              onClick={() => void handleRescheduleAll()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {busyAction && !reschedulingId ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" aria-hidden />
              )}
              Plan neu staffeln
            </button>
          )}
        </div>

        {loading ? null : slots.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine Plan-Slots.</p>
        ) : (
          <ul className="rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-100 shadow-sm">
            {slots.map((slot) => {
              const pool = slot.job_pool
              const isOpen =
                slot.status !== 'erledigt' && slot.status !== 'uebersprungen'
              const openIndex = upcomingSlots.findIndex((s) => s.id === slot.id)
              const isMoving = reschedulingId === slot.id
              const sameDayCount = slots.filter(
                (s) =>
                  s.plan_date === slot.plan_date &&
                  s.status !== 'erledigt' &&
                  s.status !== 'uebersprungen',
              ).length

              return (
                <li
                  key={slot.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs text-zinc-400">
                      {formatPlanDate(slot.plan_date)}
                      {sameDayCount > 1 ? ` · #${slot.sort_order + 1}` : ''}
                      {slot.label ? ` · ${slot.label}` : ''}
                      {' · '}
                      {SLOT_STATUS_LABEL[slot.status] ?? slot.status}
                      {slot.plan_date === today ? ' · heute' : ''}
                    </p>
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {pool?.company_name ?? 'Ohne Zuweisung'}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {pool
                        ? `${poolTitle(pool)} · ${TYPE_LABEL[pool.application_type]}`
                        : '—'}
                    </p>
                  </div>

                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <div className="flex flex-wrap items-center gap-2">
                      {pool && (
                        <div
                          role="group"
                          aria-label="Typ"
                          className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-zinc-50"
                        >
                          {(['regular', 'initiative'] as const).map((t) => {
                            const active = pool.application_type === t
                            return (
                              <button
                                key={t}
                                type="button"
                                disabled={busyAction || !isOpen}
                                onClick={() => void handleTypeToggle(pool.id, t)}
                                className={[
                                  'rounded-[5px] px-2 py-1 text-[11px] font-medium transition-colors',
                                  active
                                    ? 'bg-zinc-900 text-white'
                                    : 'text-zinc-600 hover:text-zinc-900',
                                ].join(' ')}
                              >
                                {TYPE_LABEL[t]}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {pool?.application_id ? (
                        <Link
                          to={`/admin/applications/${pool.application_id}`}
                          className="text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
                        >
                          Bewerbung
                        </Link>
                      ) : pool ? (
                        <Link
                          to={`/admin/new?pool=${pool.id}`}
                          className="text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
                        >
                          Erstellen
                        </Link>
                      ) : null}
                    </div>

                    {isOpen && (
                      <div
                        role="group"
                        aria-label="Umplanen"
                        className="flex flex-wrap items-center gap-1"
                      >
                        <button
                          type="button"
                          title="Nach oben"
                          disabled={moveBusy || openIndex <= 0}
                          onClick={() => void handleSlotMove(slot.id, 'up')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                        >
                          {isMoving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                          ) : (
                            <ArrowUp className="w-3.5 h-3.5" aria-hidden />
                          )}
                          <span className="sr-only">Nach oben</span>
                        </button>
                        <button
                          type="button"
                          title="Nach unten"
                          disabled={
                            moveBusy ||
                            openIndex < 0 ||
                            openIndex >= upcomingSlots.length - 1
                          }
                          onClick={() => void handleSlotMove(slot.id, 'down')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                        >
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden />
                          <span className="sr-only">Nach unten</span>
                        </button>
                        <button
                          type="button"
                          title="Einen Tag früher"
                          disabled={moveBusy}
                          onClick={() => void handleSlotMove(slot.id, 'earlier')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
                          <span className="sr-only">Einen Tag früher</span>
                        </button>
                        <button
                          type="button"
                          title="Einen Tag später"
                          disabled={moveBusy}
                          onClick={() => void handleSlotMove(slot.id, 'later')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
                        >
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
                          <span className="sr-only">Einen Tag später</span>
                        </button>
                        <button
                          type="button"
                          title="Auf heute (auch als 2. Stelle)"
                          disabled={moveBusy}
                          onClick={() => void handleSlotMove(slot.id, 'today')}
                          className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 h-7 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                        >
                          <Sunrise className="w-3 h-3" aria-hidden />
                          Heute
                        </button>
                        <button
                          type="button"
                          title="Auf morgen"
                          disabled={moveBusy}
                          onClick={() => void handleSlotMove(slot.id, 'tomorrow')}
                          className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 h-7 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                        >
                          <Sunset className="w-3 h-3" aria-hidden />
                          Morgen
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {upcomingSlots.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const events = upcomingSlots.map((slot) => ({
                id: slot.id,
                plan_date: slot.plan_date,
                company_name: slot.job_pool?.company_name ?? 'Firma',
                title: slot.job_pool?.title,
                application_type: slot.job_pool?.application_type,
                source_url: slot.job_pool?.source_url,
              }))
              const { filename, error: icalError } = downloadPlanBatchIcal(events)
              if (icalError) setError(icalError)
              else setNotice(`.ics „${filename}“ erneut heruntergeladen.`)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            <CalendarPlus className="w-3.5 h-3.5" aria-hidden />
            Offene Plan-Tage als .ics neu laden
          </button>
        )}
      </section>

      {user?.id && manualSentApp && (
        <ManualSentDialog
          open
          application={manualSentApp}
          userId={user.id}
          onClose={() => setManualSentApp(null)}
          onError={(message) => {
            setError(message)
            setNotice(null)
          }}
          onDone={({ filename, uploaded }) => {
            const parts = ['Als manuell versendet markiert']
            if (uploaded > 0) parts.push(`${uploaded} Datei(en) hochgeladen`)
            if (filename) parts.push(`Follow-up-.ics „${filename}“ (Absende + 14 Tage)`)
            setNotice(parts.join(' — ') + '.')
            setManualSentApp(null)
            void load()
          }}
        />
      )}
    </div>
  )
}
