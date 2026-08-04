export type ApplicationIcalInput = {
  id?: string
  company_name: string
  job_title: string
  applied_at: string
  /** Optionaler Link/Notiz für DESCRIPTION */
  notes?: string | null
  source_url?: string | null
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** UTC-Zeitstempel im iCal-Format: YYYYMMDDTHHMMSSZ */
export function formatIcalUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  )
}

/** Escape für TEXT-Werte in iCal (RFC 5545). */
export function escapeIcalText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n')
}

function foldIcalLine(line: string): string {
  const max = 75
  if (line.length <= max) return line
  const parts: string[] = []
  let remaining = line
  parts.push(remaining.slice(0, max))
  remaining = remaining.slice(max)
  while (remaining.length > 0) {
    parts.push(` ${remaining.slice(0, max - 1)}`)
    remaining = remaining.slice(max - 1)
  }
  return parts.join('\r\n')
}

function slugifyFilenamePart(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || 'firma'
}

function buildDescription(input: ApplicationIcalInput): string | undefined {
  const parts: string[] = []
  if (input.notes?.trim()) parts.push(input.notes.trim())
  if (input.source_url?.trim()) parts.push(`Link: ${input.source_url.trim()}`)
  return parts.length > 0 ? parts.join('\n') : undefined
}

function vevent(params: {
  uid: string
  dtstamp: string
  /** Timed: YYYYMMDDTHHMMSSZ — All-day: YYYYMMDD with allDay=true */
  dtstart: string
  summary: string
  description?: string
  allDay?: boolean
}): string {
  const dtstartLine = params.allDay
    ? `DTSTART;VALUE=DATE:${params.dtstart}`
    : `DTSTART:${params.dtstart}`
  const lines = [
    'BEGIN:VEVENT',
    `UID:${params.uid}`,
    `DTSTAMP:${params.dtstamp}`,
    dtstartLine,
    `SUMMARY:${escapeIcalText(params.summary)}`,
  ]
  if (params.description) {
    lines.push(`DESCRIPTION:${escapeIcalText(params.description)}`)
  }
  lines.push('END:VEVENT')
  return lines.map(foldIcalLine).join('\r\n')
}

/** YYYY-MM-DD → YYYYMMDD */
export function formatIcalDateOnly(planDate: string): string {
  return planDate.replace(/-/g, '')
}

export type PlanIcalEventInput = {
  id?: string
  plan_date: string
  company_name: string
  title?: string | null
  application_type?: 'regular' | 'initiative' | null
  source_url?: string | null
}

/**
 * Erzeugt eine .ics mit ganztägigen Events für alle Plan-Tage
 * („Bewerbung planen: Firma“).
 */
export function buildPlanBatchIcal(events: PlanIcalEventInput[]): string {
  if (events.length === 0) {
    throw new Error('Keine Plan-Termine zum Export')
  }

  const now = new Date()
  const dtstamp = formatIcalUtc(now)
  const vevents = events.map((event, index) => {
    const company = event.company_name.trim() || 'Firma'
    const title = event.title?.trim()
    const typeLabel =
      event.application_type === 'initiative' ? 'Initiativ' : 'Stelle'
    const summary = `Bewerbung planen: ${company}`
    const descParts = [
      title ? `${typeLabel}: ${title}` : typeLabel,
      'Erinnerung: Bewerbung erstellen und versenden.',
    ]
    if (event.source_url?.trim()) {
      descParts.push(`Link: ${event.source_url.trim()}`)
    }
    const baseUid =
      event.id?.trim() ||
      `${slugifyFilenamePart(company)}-${formatIcalDateOnly(event.plan_date)}-${index}`

    return vevent({
      uid: `plan-${baseUid}@portfolio-ats`,
      dtstamp,
      dtstart: formatIcalDateOnly(event.plan_date),
      summary,
      description: descParts.join('\n'),
      allDay: true,
    })
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sven Sieber//Personal ATS//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function planBatchIcalFilename(count: number): string {
  return `bewerbungsplan-${count}-tage.ics`
}

export function downloadPlanBatchIcal(events: PlanIcalEventInput[]): {
  filename: string
  error: string | null
} {
  try {
    const ics = buildPlanBatchIcal(events)
    const filename = planBatchIcalFilename(events.length)
    downloadIcalFile(ics, filename)
    return { filename, error: null }
  } catch (err) {
    return {
      filename: '',
      error: err instanceof Error ? err.message : 'Plan-Kalender-Export fehlgeschlagen',
    }
  }
}

/**
 * Erzeugt eine .ics-Datei mit zwei Terminen:
 * 1) Bewerbung abgeschickt (applied_at)
 * 2) Follow-up 14 Tage später
 */
export function buildApplicationIcal(input: ApplicationIcalInput): string {
  const applied = new Date(input.applied_at)
  if (Number.isNaN(applied.getTime())) {
    throw new Error('Ungültiges applied_at-Datum')
  }

  const followUp = new Date(applied.getTime() + 14 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const dtstamp = formatIcalUtc(now)
  const baseUid = input.id?.trim() || `${slugifyFilenamePart(input.company_name)}-${applied.getTime()}`
  const company = input.company_name.trim() || 'Firma'
  const jobTitle = input.job_title.trim() || 'Stelle'
  const description = buildDescription(input)

  const event1 = vevent({
    uid: `bewerbung-${baseUid}@portfolio-ats`,
    dtstamp,
    dtstart: formatIcalUtc(applied),
    summary: `Bewerbung abgeschickt: ${jobTitle} bei ${company}`,
    description,
  })

  const event2 = vevent({
    uid: `followup-${baseUid}@portfolio-ats`,
    dtstamp,
    dtstart: formatIcalUtc(followUp),
    summary: `Follow-up / Nachfassen bei ${company}`,
    description: description
      ? `Nachfassen zur Bewerbung „${jobTitle}“.\n${description}`
      : `Nachfassen zur Bewerbung „${jobTitle}“.`,
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sven Sieber//Personal ATS//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    event1,
    event2,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function applicationIcalFilename(companyName: string): string {
  return `bewerbung-${slugifyFilenamePart(companyName)}-followup.ics`
}

/** Lädt eine .ics-Datei im Browser herunter (Blob + Object URL). */
export function downloadIcalFile(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadApplicationIcal(input: ApplicationIcalInput): {
  filename: string
  error: string | null
} {
  try {
    const ics = buildApplicationIcal(input)
    const filename = applicationIcalFilename(input.company_name)
    downloadIcalFile(ics, filename)
    return { filename, error: null }
  } catch (err) {
    return {
      filename: '',
      error: err instanceof Error ? err.message : 'Kalender-Export fehlgeschlagen',
    }
  }
}
