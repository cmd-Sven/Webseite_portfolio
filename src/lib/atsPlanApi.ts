import { supabase } from './supabaseClient'
import { listJobPoolEntries, updateJobPoolEntry } from './atsPoolApi'
import type {
  ApplicationPlanSlotRow,
  ApplicationPlanSlotStatus,
  JobPoolRow,
} from '../types/ats'

export type PlanSlotWithPool = ApplicationPlanSlotRow & {
  job_pool: JobPoolRow | null
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse YYYY-MM-DD as local calendar date (noon to avoid DST edge cases). */
export function parsePlanDateLocal(planDate: string): Date {
  const [y, m, d] = planDate.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0)
}

export function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function todayLocalDateString(): string {
  return toLocalDateString(new Date())
}

/** Noch nicht erledigt — inkl. übersprungen (ausgesetzte Tage bleiben Todos). */
export function isTodoPlanSlotStatus(status: ApplicationPlanSlotStatus): boolean {
  return status !== 'erledigt'
}

/** Aktiv im Kalender (Unique plan_date+sort_order greift nur hier). */
export function isActivePlanSlotStatus(status: ApplicationPlanSlotStatus): boolean {
  return status === 'offen' || status === 'zugewiesen'
}

/** Vergangene, nicht erledigte Slots (inkl. uebersprungen). */
export function isOverduePlanSlot(
  slot: Pick<ApplicationPlanSlotRow, 'plan_date' | 'status'>,
  today: string = todayLocalDateString(),
): boolean {
  return isTodoPlanSlotStatus(slot.status) && slot.plan_date < today
}

function mapSlotRow(row: Record<string, unknown>): PlanSlotWithPool {
  const jobPoolRaw = row.job_pool
  let job_pool: JobPoolRow | null = null
  if (jobPoolRaw && typeof jobPoolRaw === 'object' && !Array.isArray(jobPoolRaw)) {
    job_pool = jobPoolRaw as JobPoolRow
  } else if (Array.isArray(jobPoolRaw) && jobPoolRaw[0]) {
    job_pool = jobPoolRaw[0] as JobPoolRow
  }

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    plan_date: String(row.plan_date),
    sort_order: typeof row.sort_order === 'number' ? row.sort_order : Number(row.sort_order ?? 0),
    label: (row.label as string | null) ?? null,
    job_pool_id: (row.job_pool_id as string | null) ?? null,
    status: row.status as ApplicationPlanSlotStatus,
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at),
    job_pool,
  }
}

export async function listPlanSlots(options?: {
  fromDate?: string
  toDate?: string
  includeDone?: boolean
}): Promise<{ data: PlanSlotWithPool[]; error: string | null }> {
  let query = supabase
    .from('application_plan_slots')
    .select('*, job_pool(*)')
    .order('plan_date', { ascending: true })
    .order('sort_order', { ascending: true })

  if (options?.fromDate) {
    query = query.gte('plan_date', options.fromDate)
  }
  if (options?.toDate) {
    query = query.lte('plan_date', options.toDate)
  }
  if (!options?.includeDone) {
    query = query.neq('status', 'erledigt')
  }

  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return {
    data: ((data as Record<string, unknown>[]) ?? []).map(mapSlotRow),
    error: null,
  }
}

export async function listAllPlanSlots(): Promise<{
  data: PlanSlotWithPool[]
  error: string | null
}> {
  return listPlanSlots({ includeDone: true })
}

/** Heutige(r) Slot(s), sonst nächster offener/zugewiesener Slot ab heute. */
export async function getTodayOrNextSlot(): Promise<{
  data: PlanSlotWithPool | null
  error: string | null
}> {
  const { data, error } = await getTodayOrNextSlots()
  if (error) return { data: null, error }
  return { data: data[0] ?? null, error: null }
}

/** Alle heutigen offenen Slots, sonst der nächste Tag (1+ Slots). */
export async function getTodayOrNextSlots(): Promise<{
  data: PlanSlotWithPool[]
  error: string | null
}> {
  const today = todayLocalDateString()
  const { data: todayRows, error: todayError } = await supabase
    .from('application_plan_slots')
    .select('*, job_pool(*)')
    .eq('plan_date', today)
    .in('status', ['offen', 'zugewiesen'])
    .order('sort_order', { ascending: true })

  if (todayError) return { data: [], error: todayError.message }
  const todaySlots = ((todayRows as Record<string, unknown>[]) ?? []).map(mapSlotRow)
  if (todaySlots.length > 0) return { data: todaySlots, error: null }

  const { data: nextRows, error: nextError } = await supabase
    .from('application_plan_slots')
    .select('*, job_pool(*)')
    .gt('plan_date', today)
    .in('status', ['offen', 'zugewiesen'])
    .order('plan_date', { ascending: true })
    .order('sort_order', { ascending: true })
    .limit(20)

  if (nextError) return { data: [], error: nextError.message }
  const mapped = ((nextRows as Record<string, unknown>[]) ?? []).map(mapSlotRow)
  if (mapped.length === 0) return { data: [], error: null }
  const firstDate = mapped[0].plan_date
  return {
    data: mapped.filter((s) => s.plan_date === firstDate),
    error: null,
  }
}

/**
 * Überfällige Todos: plan_date &lt; heute und nicht erledigt
 * (offen / zugewiesen / uebersprungen — ausgesetzte Tage bleiben Todos).
 */
export async function listOverduePlanSlots(): Promise<{
  data: PlanSlotWithPool[]
  error: string | null
}> {
  const today = todayLocalDateString()
  const { data, error } = await supabase
    .from('application_plan_slots')
    .select('*, job_pool(*)')
    .lt('plan_date', today)
    .neq('status', 'erledigt')
    .order('plan_date', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: error.message }
  return {
    data: ((data as Record<string, unknown>[]) ?? []).map(mapSlotRow),
    error: null,
  }
}

export type CreatePlanResult = {
  slots: PlanSlotWithPool[]
  skippedOccupiedDates: string[]
  plannedPoolIds: string[]
  /** Pool-IDs, die bereits einen Plan-Slot haben (beim Fortsetzen übersprungen). */
  skippedAlreadyPlannedPoolIds: string[]
}

/**
 * Legt ab `startDate` (YYYY-MM-DD) je einen Slot/Tag für die gegebenen Pool-IDs an.
 * Belegte Tage werden übersprungen. Pool-Status → geplant.
 */
export async function createPlanForPoolEntries(params: {
  userId: string
  poolIds: string[]
  startDate: string
}): Promise<{ data: CreatePlanResult | null; error: string | null }> {
  const poolIds = [...new Set(params.poolIds.filter(Boolean))]
  if (poolIds.length === 0) {
    return { data: null, error: 'Keine Pool-Einträge ausgewählt' }
  }

  const { data: existingSlotRows, error: existingError } = await supabase
    .from('application_plan_slots')
    .select('job_pool_id')
    .eq('user_id', params.userId)
    .in('job_pool_id', poolIds)

  if (existingError) return { data: null, error: existingError.message }

  const skippedAlreadyPlannedPoolIds = [
    ...new Set(
      ((existingSlotRows as { job_pool_id: string | null }[]) ?? [])
        .map((r) => r.job_pool_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  const newPoolIds = poolIds.filter((id) => !skippedAlreadyPlannedPoolIds.includes(id))

  if (newPoolIds.length === 0) {
    return {
      data: {
        slots: [],
        skippedOccupiedDates: [],
        plannedPoolIds: [],
        skippedAlreadyPlannedPoolIds,
      },
      error: null,
    }
  }

  const { data: occupiedRows, error: occupiedError } = await supabase
    .from('application_plan_slots')
    .select('plan_date')
    .eq('user_id', params.userId)
    .gte('plan_date', params.startDate)

  if (occupiedError) return { data: null, error: occupiedError.message }

  const occupied = new Set(
    ((occupiedRows as { plan_date: string }[]) ?? []).map((r) => r.plan_date),
  )

  const dates: string[] = []
  let cursor = parsePlanDateLocal(params.startDate)
  while (dates.length < newPoolIds.length) {
    const key = toLocalDateString(cursor)
    if (!occupied.has(key)) {
      dates.push(key)
    }
    cursor = addDaysLocal(cursor, 1)
    // safety: avoid infinite loop
    if (dates.length + occupied.size > newPoolIds.length + 400) {
      return { data: null, error: 'Zu viele belegte Plan-Tage – bitte Start datum prüfen' }
    }
  }

  const skippedOccupiedDates = [...occupied].filter((d) => d >= params.startDate).sort()

  const inserts = newPoolIds.map((poolId, index) => ({
    user_id: params.userId,
    plan_date: dates[index],
    sort_order: 0,
    label: `Tag ${index + 1}`,
    job_pool_id: poolId,
    status: 'zugewiesen' as ApplicationPlanSlotStatus,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('application_plan_slots')
    .insert(inserts)
    .select('*, job_pool(*)')

  if (insertError) return { data: null, error: insertError.message }

  const plannedPoolIds: string[] = []
  for (const poolId of newPoolIds) {
    const { error: updateError } = await updateJobPoolEntry(poolId, { status: 'geplant' })
    if (!updateError) plannedPoolIds.push(poolId)
  }

  return {
    data: {
      slots: ((inserted as Record<string, unknown>[]) ?? []).map(mapSlotRow),
      skippedOccupiedDates,
      plannedPoolIds,
      skippedAlreadyPlannedPoolIds,
    },
    error: null,
  }
}

export type ReplanSlotsResult = {
  slots: PlanSlotWithPool[]
  skippedOccupiedDates: string[]
}

/**
 * Verschiebt bestehende Slots (z. B. überfällig / uebersprungen) auf freie Tage ab startDate.
 * Unique (user_id, job_pool_id) → UPDATE plan_date/status, kein Insert.
 * Status wird auf „zugewiesen“ gesetzt (Todos wieder aktiv im Plan).
 */
export async function replanExistingPlanSlots(params: {
  userId: string
  slotIds: string[]
  startDate: string
}): Promise<{ data: ReplanSlotsResult | null; error: string | null }> {
  const slotIds = [...new Set(params.slotIds.filter(Boolean))]
  if (slotIds.length === 0) {
    return { data: null, error: 'Keine Slots ausgewählt' }
  }

  const { data: slotRows, error: loadError } = await supabase
    .from('application_plan_slots')
    .select('*, job_pool(*)')
    .eq('user_id', params.userId)
    .in('id', slotIds)

  if (loadError) return { data: null, error: loadError.message }

  const slots = ((slotRows as Record<string, unknown>[]) ?? []).map(mapSlotRow)
  if (slots.length === 0) {
    return { data: null, error: 'Keine passenden Slots gefunden' }
  }

  const todoSlots = slots.filter((s) => isTodoPlanSlotStatus(s.status))
  if (todoSlots.length === 0) {
    return { data: null, error: 'Alle ausgewählten Slots sind bereits erledigt' }
  }

  const movingIds = new Set(todoSlots.map((s) => s.id))

  const { data: occupiedRows, error: occupiedError } = await supabase
    .from('application_plan_slots')
    .select('id, plan_date, status')
    .eq('user_id', params.userId)
    .gte('plan_date', params.startDate)
    .in('status', ['offen', 'zugewiesen'])

  if (occupiedError) return { data: null, error: occupiedError.message }

  const occupied = new Set(
    ((occupiedRows as { id: string; plan_date: string; status: string }[]) ?? [])
      .filter((r) => !movingIds.has(r.id))
      .map((r) => r.plan_date),
  )

  const dates: string[] = []
  let cursor = parsePlanDateLocal(params.startDate)
  while (dates.length < todoSlots.length) {
    const key = toLocalDateString(cursor)
    if (!occupied.has(key)) {
      dates.push(key)
    }
    cursor = addDaysLocal(cursor, 1)
    if (dates.length + occupied.size > todoSlots.length + 400) {
      return { data: null, error: 'Zu viele belegte Plan-Tage – bitte Startdatum prüfen' }
    }
  }

  const skippedOccupiedDates = [...occupied].filter((d) => d >= params.startDate).sort()

  // Chronologisch nach bisherigem Datum, damit die Reihenfolge der Todos erhalten bleibt
  const ordered = [...todoSlots].sort((a, b) => {
    if (a.plan_date !== b.plan_date) return a.plan_date.localeCompare(b.plan_date)
    return a.sort_order - b.sort_order
  })

  // Phase 1: temporäre sort_orders (Unique-Kollisionen vermeiden)
  for (let i = 0; i < ordered.length; i++) {
    const { error } = await supabase
      .from('application_plan_slots')
      .update({
        plan_date: dates[i],
        sort_order: 10_000 + i,
        status: 'zugewiesen' as ApplicationPlanSlotStatus,
        label: `Tag ${i + 1}`,
      })
      .eq('id', ordered[i].id)
    if (error) return { data: null, error: error.message }
  }

  const updated: PlanSlotWithPool[] = []
  for (let i = 0; i < ordered.length; i++) {
    const { data, error } = await supabase
      .from('application_plan_slots')
      .update({
        plan_date: dates[i],
        sort_order: 0,
        status: 'zugewiesen' as ApplicationPlanSlotStatus,
        label: `Tag ${i + 1}`,
      })
      .eq('id', ordered[i].id)
      .select('*, job_pool(*)')
      .maybeSingle()
    if (error) return { data: null, error: error.message }
    if (data) updated.push(mapSlotRow(data as Record<string, unknown>))

    const poolId = ordered[i].job_pool_id
    if (poolId) {
      await updateJobPoolEntry(poolId, { status: 'geplant' })
    }
  }

  return {
    data: { slots: updated, skippedOccupiedDates },
    error: null,
  }
}

/** Unlinked Pool-Einträge mit Status gesammelt (Standard für „Plan für alle“). */
export async function listPoolEntriesForPlanning(): Promise<{
  data: JobPoolRow[]
  error: string | null
}> {
  return listJobPoolEntries({
    status: 'gesammelt',
    unlinkedOnly: true,
  })
}

export async function updatePlanSlot(
  id: string,
  patch: Partial<
    Pick<
      ApplicationPlanSlotRow,
      'status' | 'notes' | 'label' | 'job_pool_id' | 'plan_date' | 'sort_order'
    >
  >,
): Promise<{ data: PlanSlotWithPool | null; error: string | null }> {
  const { data, error } = await supabase
    .from('application_plan_slots')
    .update(patch)
    .eq('id', id)
    .select('*, job_pool(*)')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Slot nicht gefunden' }
  return { data: mapSlotRow(data as Record<string, unknown>), error: null }
}

export async function markPlanSlotDone(
  slotId: string,
): Promise<{ data: PlanSlotWithPool | null; error: string | null }> {
  return updatePlanSlot(slotId, { status: 'erledigt' })
}

/** Findet Slot zu einem Pool-Eintrag (für Status-Sync nach Versand). */
export async function findPlanSlotByPoolId(
  jobPoolId: string,
): Promise<{ data: PlanSlotWithPool | null; error: string | null }> {
  const { data, error } = await supabase
    .from('application_plan_slots')
    .select('*, job_pool(*)')
    .eq('job_pool_id', jobPoolId)
    .order('plan_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }
  return { data: mapSlotRow(data as Record<string, unknown>), error: null }
}

export type RescheduleSlotResult<T extends { id: string }> = T & {
  plan_date: string
  sort_order: number
  label: string
}

export type ReschedulePlanOptions = {
  /** Erster Tag für die Staffelung (YYYY-MM-DD). */
  startDate: string
  /** Standard-Kapazität pro Tag für nicht explizit gesetzte Tage. Default 1. */
  maxPerDay?: number
  /**
   * Explizite Kapazität je Datum (z. B. heute: 2).
   * Tage mit gesetzter Kapazität behalten diese Staffelung;
   * danach gilt wieder maxPerDay.
   */
  capacityByDate?: Record<string, number>
}

/**
 * Staffelt Slots in gegebener Reihenfolge neu auf Kalendertage.
 * Keine Lücken, keine Duplikate der Reihenfolge; 1–n pro Tag laut Kapazität.
 */
export function reschedulePlanSlots<T extends { id: string }>(
  orderedSlots: T[],
  options: ReschedulePlanOptions,
): RescheduleSlotResult<T>[] {
  const maxPerDay = Math.max(1, options.maxPerDay ?? 1)
  const capacityByDate = options.capacityByDate ?? {}
  const results: RescheduleSlotResult<T>[] = []

  let cursor = parsePlanDateLocal(options.startDate)
  let dayKey = toLocalDateString(cursor)
  let dayCount = 0
  let dayCapacity = capacityByDate[dayKey] ?? maxPerDay

  for (let i = 0; i < orderedSlots.length; i++) {
    while (dayCount >= dayCapacity) {
      cursor = addDaysLocal(cursor, 1)
      dayKey = toLocalDateString(cursor)
      dayCount = 0
      dayCapacity = capacityByDate[dayKey] ?? maxPerDay
    }

    results.push({
      ...orderedSlots[i],
      plan_date: dayKey,
      sort_order: dayCount,
      label: `Tag ${i + 1}`,
    })
    dayCount += 1
  }

  return results
}

/**
 * Leitet Kapazität aus aktuellen Daten ab: Tage mit ≥2 Slots bleiben „breit“,
 * alle anderen nutzen maxPerDay (default 1). Optional: Extra-Kapazität erzwingen.
 */
export function deriveCapacityByDate(
  slots: Array<{ plan_date: string }>,
  options?: { maxPerDay?: number; forceCapacity?: Record<string, number> },
): Record<string, number> {
  const maxPerDay = Math.max(1, options?.maxPerDay ?? 1)
  const counts: Record<string, number> = {}
  for (const s of slots) {
    counts[s.plan_date] = (counts[s.plan_date] ?? 0) + 1
  }
  const capacity: Record<string, number> = { ...(options?.forceCapacity ?? {}) }
  for (const [date, count] of Object.entries(counts)) {
    if (count > maxPerDay) {
      capacity[date] = Math.max(capacity[date] ?? 0, count)
    }
  }
  return capacity
}

/** Schreibt plan_date / sort_order / label für mehrere Slots (nach Reschedule).
 * Setzt status auf „zugewiesen“, damit uebersprungene Todos wieder aktiv sind.
 */
export async function persistPlanSlotSchedule(
  updates: Array<{ id: string; plan_date: string; sort_order: number; label?: string }>,
): Promise<{ error: string | null }> {
  // Zwei Phasen: zuerst temporäre sort_orders (hohe Offsets), dann Zielwerte —
  // vermeidet Unique-(user_id, plan_date, sort_order)-Kollisionen beim Umschichten.
  for (let i = 0; i < updates.length; i++) {
    const u = updates[i]
    const { error } = await supabase
      .from('application_plan_slots')
      .update({
        plan_date: u.plan_date,
        sort_order: 10_000 + i,
        status: 'zugewiesen' as ApplicationPlanSlotStatus,
      })
      .eq('id', u.id)
    if (error) return { error: error.message }
  }

  for (const u of updates) {
    const patch: Record<string, unknown> = {
      plan_date: u.plan_date,
      sort_order: u.sort_order,
      status: 'zugewiesen' as ApplicationPlanSlotStatus,
    }
    if (u.label != null) patch.label = u.label
    const { error } = await supabase
      .from('application_plan_slots')
      .update(patch)
      .eq('id', u.id)
    if (error) return { error: error.message }
  }

  return { error: null }
}

export type MoveSlotAction =
  | 'today'
  | 'tomorrow'
  | 'earlier'
  | 'later'
  | 'up'
  | 'down'

function sortSlotsChronologically(slots: PlanSlotWithPool[]): PlanSlotWithPool[] {
  return [...slots].sort((a, b) => {
    if (a.plan_date !== b.plan_date) return a.plan_date.localeCompare(b.plan_date)
    return a.sort_order - b.sort_order
  })
}

/** Fügt `slot` am Ende von `targetDate` ein; Rest behält relative Reihenfolge. */
function placeSlotOnDate(
  ordered: PlanSlotWithPool[],
  slot: PlanSlotWithPool,
  targetDate: string,
): { nextOrder: PlanSlotWithPool[]; forceCapacity: Record<string, number> } {
  const without = ordered.filter((s) => s.id !== slot.id)
  const before = without.filter((s) => s.plan_date < targetDate)
  const sameDay = without.filter((s) => s.plan_date === targetDate)
  const after = without.filter((s) => s.plan_date > targetDate)
  const nextOrder = [...before, ...sameDay, slot, ...after]
  const forceCapacity = deriveCapacityByDate(without, { maxPerDay: 1 })
  forceCapacity[targetDate] = sameDay.length + 1
  return { nextOrder, forceCapacity }
}

/**
 * Verschiebt einen offenen Slot und staffelt den Restplan neu.
 * - today/tomorrow: Slot auf den Zieltag; Kapazität dort steigt (z. B. „heute 2“)
 * - earlier/later: Slot einen Kalendertag verschieben, dann Cascade
 * - up/down: nur Reihenfolge tauschen, bestehende Tages-Kapazität behalten
 */
export function applySlotMove(
  openSlots: PlanSlotWithPool[],
  slotId: string,
  action: MoveSlotAction,
  options?: { today?: string; maxPerDay?: number },
): {
  schedule: RescheduleSlotResult<PlanSlotWithPool>[]
  notice: string
} | null {
  const today = options?.today ?? todayLocalDateString()
  const tomorrow = toLocalDateString(addDaysLocal(parsePlanDateLocal(today), 1))
  const maxPerDay = options?.maxPerDay ?? 1

  const ordered = sortSlotsChronologically(openSlots)
  const index = ordered.findIndex((s) => s.id === slotId)
  if (index < 0) return null

  const slot = ordered[index]
  let nextOrder = ordered
  let startDate = ordered[0]?.plan_date ?? today
  let forceCapacity: Record<string, number> = {}
  let notice = 'Plan aktualisiert.'

  if (action === 'up') {
    if (index === 0) return null
    nextOrder = [...ordered]
    ;[nextOrder[index - 1], nextOrder[index]] = [nextOrder[index], nextOrder[index - 1]]
    forceCapacity = deriveCapacityByDate(ordered, { maxPerDay })
    notice = 'Slot nach oben verschoben — Restplan neu gestaffelt.'
  } else if (action === 'down') {
    if (index >= ordered.length - 1) return null
    nextOrder = [...ordered]
    ;[nextOrder[index], nextOrder[index + 1]] = [nextOrder[index + 1], nextOrder[index]]
    forceCapacity = deriveCapacityByDate(ordered, { maxPerDay })
    notice = 'Slot nach unten verschoben — Restplan neu gestaffelt.'
  } else if (action === 'today') {
    const without = ordered.filter((s) => s.id !== slot.id)
    const othersToday = without.filter((s) => s.plan_date === today)
    const rest = without.filter((s) => s.plan_date !== today)
    nextOrder = [...othersToday, slot, ...rest]
    forceCapacity = {
      ...deriveCapacityByDate(without, { maxPerDay }),
      [today]: othersToday.length + 1,
    }
    startDate = today
    notice =
      forceCapacity[today]! > 1
        ? `Slot auf heute gesetzt (${forceCapacity[today]} Stellen heute) — Restplan nachgezogen.`
        : 'Slot auf heute gesetzt — Restplan nachgezogen.'
  } else if (action === 'tomorrow') {
    const without = ordered.filter((s) => s.id !== slot.id)
    const todaySlots = without.filter((s) => s.plan_date === today)
    const othersTomorrow = without.filter((s) => s.plan_date === tomorrow)
    const later = without.filter(
      (s) => s.plan_date !== today && s.plan_date !== tomorrow,
    )
    nextOrder = [...todaySlots, ...othersTomorrow, slot, ...later]
    forceCapacity = deriveCapacityByDate(without, { maxPerDay })
    if (todaySlots.length > 0) forceCapacity[today] = todaySlots.length
    forceCapacity[tomorrow] = othersTomorrow.length + 1
    startDate = todaySlots.length > 0 ? today : tomorrow
    notice = 'Slot auf morgen gesetzt — Restplan nachgezogen.'
  } else if (action === 'earlier') {
    const targetDate = toLocalDateString(
      addDaysLocal(parsePlanDateLocal(slot.plan_date), -1),
    )
    if (targetDate < today) {
      return applySlotMove(openSlots, slotId, 'today', options)
    }
    const placed = placeSlotOnDate(ordered, slot, targetDate)
    nextOrder = placed.nextOrder
    forceCapacity = placed.forceCapacity
    startDate = nextOrder[0]?.plan_date ?? today
    notice = 'Slot einen Tag früher — Restplan nachgezogen.'
  } else if (action === 'later') {
    const targetDate = toLocalDateString(
      addDaysLocal(parsePlanDateLocal(slot.plan_date), 1),
    )
    const placed = placeSlotOnDate(ordered, slot, targetDate)
    nextOrder = placed.nextOrder
    forceCapacity = placed.forceCapacity
    startDate = nextOrder[0]?.plan_date ?? today
    notice = 'Slot einen Tag später — Restplan nachgezogen.'
  } else {
    return null
  }

  if (startDate < today) startDate = today

  const schedule = reschedulePlanSlots(nextOrder, {
    startDate,
    maxPerDay,
    capacityByDate: forceCapacity,
  })

  return { schedule, notice }
}

/**
 * Neu staffeln: offene Slots in aktueller Reihenfolge ab startDate packen.
 * Tage die bereits >1 Slot haben, behalten ihre Kapazität (außer flatten=true).
 */
export function rebuildOpenPlanSchedule(
  openSlots: PlanSlotWithPool[],
  options?: {
    startDate?: string
    maxPerDay?: number
    flatten?: boolean
    forceCapacity?: Record<string, number>
  },
): RescheduleSlotResult<PlanSlotWithPool>[] {
  const today = todayLocalDateString()
  const maxPerDay = options?.maxPerDay ?? 1
  const ordered = [...openSlots].sort((a, b) => {
    if (a.plan_date !== b.plan_date) return a.plan_date.localeCompare(b.plan_date)
    return a.sort_order - b.sort_order
  })
  const startDate = options?.startDate ?? ordered[0]?.plan_date ?? today
  const capacityByDate = options?.flatten
    ? { ...(options.forceCapacity ?? {}) }
    : deriveCapacityByDate(ordered, {
        maxPerDay,
        forceCapacity: options?.forceCapacity,
      })

  return reschedulePlanSlots(ordered, {
    startDate: startDate < today ? today : startDate,
    maxPerDay,
    capacityByDate,
  })
}
