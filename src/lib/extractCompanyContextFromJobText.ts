import type { JobPoolLink } from '../types/ats'

export type ExtractCompanyContextOptions = {
  title?: string | null
  sourceUrl?: string | null
  companyName?: string | null
}

export type ExtractedCompanyContext = {
  /** Block „Über uns“ / Unternehmensvorstellung */
  companyInfo: string | null
  /** Zielbereich / Team / Standort / Rollen-Hints */
  targetNotes: string | null
  contactName: string | null
  contactEmail: string | null
  /** Formatierter Kontaktblock für `notes` */
  contactNotes: string | null
  /** Firmen-/Karriere-URL (nicht die Job-URL) */
  companyUrl: string | null
}

const JOB_BOARD_HOST_RE =
  /(?:^|\.)(?:indeed|stepstone|xing|linkedin|kununu|arbeitsagentur|join|softgarden|personio|greenhouse|lever|workday|jobs?\.(?:de|com)|stellenanzeigen|jobware|meinestadt|kimeta|jobvector|experteer|monster)\./i

const COMPANY_SECTION_HEADERS = [
  'über uns',
  'ueber uns',
  'über das unternehmen',
  'ueber das unternehmen',
  'das unternehmen',
  'unser unternehmen',
  'wer wir sind',
  'about us',
  'about the company',
  'company description',
  'firmenportrait',
  'unternehmensprofil',
  'wer ist',
]

const CONTACT_SECTION_HEADERS = [
  'kontakt',
  'ansprechpartner',
  'ansprechpartnerin',
  'ihre ansprechpartner',
  'ihre ansprechpartnerin',
  'bewerbungskontakt',
  'bei fragen',
  'questions?',
  'contact',
  'get in touch',
]

const TARGET_SECTION_HEADERS = [
  'standort',
  'arbeitsort',
  'location',
  'team',
  'abteilung',
  'bereich',
  'department',
  'ihre rolle',
  'das erwarten wir',
  'wir bieten',
  'benefits',
]

const EMAIL_RE =
  /[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}/g

const URL_RE =
  /https?:\/\/[^\s<>"'）)\]}>]+|www\.[^\s<>"'）)\]}>]+/gi

const CONTACT_NAME_RE =
  /(?:ansprechpartner(?:in)?|kontaktperson|hr[\s-]?kontakt|bewerbungen an)\s*[:\-–]\s*([A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{1,40}(?:\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]{1,40}){0,3})/im

const CONTACT_NAME_STOPWORDS = new Set([
  'e-mail',
  'email',
  'mail',
  'tel',
  'telefon',
  'phone',
  'mobil',
  'fax',
  'hr',
  'gmbh',
  'ag',
  'kg',
])

function cleanContactName(raw: string): string | null {
  const parts = raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter((p) => !CONTACT_NAME_STOPWORDS.has(p.toLowerCase().replace(/:$/, '')))
  const name = parts.join(' ').replace(/[,;:]+$/g, '').trim()
  if (name.length < 3 || name.length > 80) return null
  if (!/[A-Za-zÄÖÜäöüß]/.test(name)) return null
  return name
}

function extractContactName(text: string, contactSection: string | null): string | null {
  const scopes = [contactSection, text].filter(Boolean) as string[]
  for (const scope of scopes) {
    // Zeilenweise: verhindert, dass „E-Mail:“ als Namensbestandteil landet
    for (const line of scope.split('\n')) {
      const m = line.match(CONTACT_NAME_RE)
      if (m?.[1]) {
        const name = cleanContactName(m[1])
        if (name) return name
      }
    }
  }
  return null
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ')
}

function collapseBlankLines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, '').replace(/^[ \t]+/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?]+$/g, '').replace(/[)\]}>»"'”’]+$/g, '')
}

function normalizeUrl(raw: string): string | null {
  let value = stripTrailingPunctuation(raw.trim())
  if (!value) return null
  if (value.startsWith('www.')) value = `https://${value}`
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return null
  }
}

function sameUrlish(a: string, b: string): boolean {
  const na = normalizeUrl(a)
  const nb = normalizeUrl(b)
  if (!na || !nb) return false
  return na === nb || na.startsWith(nb) || nb.startsWith(na)
}

function isJobBoardUrl(url: string): boolean {
  const host = hostOf(url)
  if (!host) return true
  return JOB_BOARD_HOST_RE.test(`.${host}`)
}

function isHeaderLine(line: string, headers: string[]): boolean {
  const cleaned = line
    .trim()
    .replace(/^[#*_>\-•\d.()\s]+/, '')
    .replace(/[:\-–—]+$/, '')
    .trim()
    .toLowerCase()
  if (!cleaned || cleaned.length > 80) return false
  return headers.some(
    (h) => cleaned === h || cleaned.startsWith(`${h} `) || cleaned.startsWith(`${h}:`),
  )
}

function extractSection(
  text: string,
  startHeaders: string[],
  stopHeaders: string[],
): string | null {
  const lines = text.split('\n')
  let start = -1
  for (let i = 0; i < lines.length; i++) {
    if (isHeaderLine(lines[i], startHeaders)) {
      start = i + 1
      break
    }
  }
  if (start < 0) return null

  const stopAll = [...new Set([...stopHeaders, ...startHeaders])]
  const buf: string[] = []
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]
    if (buf.length > 0 && isHeaderLine(line, stopAll)) break
    // Indeed oft: nächster Job-Abschnitt
    if (
      buf.length > 2 &&
      isHeaderLine(line, [
        'aufgaben',
        'ihre aufgaben',
        'anforderungen',
        'ihr profil',
        'qualifikation',
        'bewerbung',
        'was wir bieten',
        'benefits',
        'jobdetails',
      ])
    ) {
      break
    }
    buf.push(line)
    if (buf.join('\n').length > 1800) break
  }

  const body = collapseBlankLines(buf.join('\n'))
  if (body.length < 40) return null
  return body.slice(0, 2500)
}

function extractEmails(text: string): string[] {
  const found = text.match(EMAIL_RE) ?? []
  const unique: string[] = []
  for (const email of found) {
    const lower = email.toLowerCase()
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.includes('example.com')) {
      continue
    }
    if (!unique.includes(lower)) unique.push(lower)
  }
  return unique
}

function extractUrls(text: string, sourceUrl?: string | null): string[] {
  const matches = text.match(URL_RE) ?? []
  const unique: string[] = []
  for (const raw of matches) {
    const url = normalizeUrl(raw)
    if (!url) continue
    if (sourceUrl && sameUrlish(url, sourceUrl)) continue
    if (isJobBoardUrl(url)) continue
    if (unique.some((u) => sameUrlish(u, url))) continue
    unique.push(url)
  }
  return unique
}

function pickCompanyUrl(
  urls: string[],
  opts: ExtractCompanyContextOptions,
): string | null {
  if (urls.length === 0) return null

  const companyHostHint = (() => {
    const name = opts.companyName?.trim().toLowerCase()
    if (!name || name === 'unbekannt') return null
    const slug = name
      .replace(/[^a-z0-9äöüß]+/gi, '')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
    return slug.length >= 3 ? slug : null
  })()

  const scored = urls.map((url) => {
    const host = hostOf(url) ?? ''
    const path = (() => {
      try {
        return new URL(url).pathname.toLowerCase()
      } catch {
        return ''
      }
    })()
    let score = 0
    if (/karriere|career|jobs|about|unternehmen|company|ueber-uns|über-uns/.test(path)) {
      score += 4
    }
    if (companyHostHint && host.replace(/\./g, '').includes(companyHostHint.slice(0, 8))) {
      score += 6
    }
    if (path === '' || path === '/') score += 2
    if (/\.(pdf|docx?|xlsx?)(\?|$)/i.test(url)) score -= 5
    return { url, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.url ?? null
}

const LOCATION_LINE_RE =
  /(?:standort|arbeitsort|ort|location|sitz)\s*[:\-–]\s*(.+)/i

const TEAM_LINE_RE =
  /(?:team|abteilung|bereich|department|unit)\s*[:\-–]\s*(.+)/i

function buildTargetNotes(
  text: string,
  opts: ExtractCompanyContextOptions,
): string | null {
  const parts: string[] = []
  const title = opts.title?.trim()
  if (title) parts.push(`Rolle / Fokus: ${title}`)

  const locationSection = extractSection(text, ['standort', 'arbeitsort', 'location'], [
    ...COMPANY_SECTION_HEADERS,
    ...CONTACT_SECTION_HEADERS,
    'aufgaben',
    'anforderungen',
  ])
  if (locationSection) {
    const first = locationSection.split('\n').find((l) => l.trim().length > 2)?.trim()
    if (first) parts.push(`Standort: ${first.slice(0, 160)}`)
  } else {
    for (const line of text.split('\n').slice(0, 40)) {
      const m = line.match(LOCATION_LINE_RE)
      if (m?.[1]) {
        parts.push(`Standort: ${m[1].trim().slice(0, 160)}`)
        break
      }
    }
  }

  for (const line of text.split('\n').slice(0, 60)) {
    const m = line.match(TEAM_LINE_RE)
    if (m?.[1]) {
      parts.push(`Team / Bereich: ${m[1].trim().slice(0, 160)}`)
      break
    }
  }

  const targetSection = extractSection(text, TARGET_SECTION_HEADERS, [
    ...COMPANY_SECTION_HEADERS,
    ...CONTACT_SECTION_HEADERS,
    'aufgaben',
    'anforderungen',
    'bewerbung',
  ])
  if (targetSection && parts.length < 4) {
    const snippet = targetSection.split('\n').slice(0, 4).join(' ').replace(/\s+/g, ' ').trim()
    if (snippet.length > 20) parts.push(snippet.slice(0, 280))
  }

  if (parts.length === 0) return null
  return parts.join('\n')
}

function formatContactNotes(
  name: string | null,
  email: string | null,
): string | null {
  const lines: string[] = []
  if (name) lines.push(`Kontakt: ${name}`)
  if (email) lines.push(`E-Mail: ${email}`)
  return lines.length > 0 ? lines.join('\n') : null
}

/**
 * Best-effort Extraktion von Unternehmenskontext aus Stellenanzeigen-Rohtext
 * (Indeed DE u. a.): Über-uns-Block, Zielhinweise, Kontakt, Firmen-URL.
 */
export function extractCompanyContextFromJobText(
  raw: string,
  opts: ExtractCompanyContextOptions = {},
): ExtractedCompanyContext {
  const text = collapseBlankLines(normalizeNewlines(raw ?? ''))
  if (!text) {
    return {
      companyInfo: null,
      targetNotes: opts.title?.trim() ? `Rolle / Fokus: ${opts.title.trim()}` : null,
      contactName: null,
      contactEmail: null,
      contactNotes: null,
      companyUrl: null,
    }
  }

  const companyInfo =
    extractSection(text, COMPANY_SECTION_HEADERS, [
      ...CONTACT_SECTION_HEADERS,
      'aufgaben',
      'ihre aufgaben',
      'anforderungen',
      'ihr profil',
      'qualifikation',
      'bewerbung',
      'was wir bieten',
      'benefits',
      'standort',
    ]) ?? null

  const contactSection = extractSection(text, CONTACT_SECTION_HEADERS, [
    ...COMPANY_SECTION_HEADERS,
    'aufgaben',
    'anforderungen',
    'impressum',
    'datenschutz',
  ])

  const emails = extractEmails(contactSection ?? text)
  const contactEmail = emails[0] ?? null
  const contactName = extractContactName(text, contactSection)
  const contactNotes = formatContactNotes(contactName, contactEmail)

  const urls = extractUrls(text, opts.sourceUrl)
  const companyUrl = pickCompanyUrl(urls, opts)

  const targetNotes = buildTargetNotes(text, opts)

  return {
    companyInfo,
    targetNotes,
    contactName,
    contactEmail,
    contactNotes,
    companyUrl,
  }
}

export type InitiativeFillableFields = {
  company_info: string
  target_notes: string
  notes: string
  linksText: string
  /** Rohtext bleibt erhalten; wird für Extraktion gelesen */
  job_description: string
  title: string
  source_url: string
  company_name: string
}

function mergeContactIntoNotes(existing: string, contactNotes: string | null): string {
  if (!contactNotes) return existing
  const trimmed = existing.trim()
  if (!trimmed) return contactNotes
  // Nicht doppelt anhängen, wenn E-Mail/Name schon stehen
  const lower = trimmed.toLowerCase()
  if (
    (contactNotes.includes('@') && lower.includes('@')) ||
    lower.includes('kontakt:') ||
    lower.includes('e-mail:')
  ) {
    return trimmed
  }
  return `${trimmed}\n\n${contactNotes}`
}

function mergeCompanyUrlIntoLinks(
  linksText: string,
  companyUrl: string | null,
): string {
  if (!companyUrl) return linksText
  const existing = linksText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const already = existing.some((line) => {
    const urlPart = line.includes('|') ? line.slice(line.indexOf('|') + 1).trim() : line
    return sameUrlish(urlPart, companyUrl)
  })
  if (already) return linksText
  const line = `Unternehmen | ${companyUrl}`
  return existing.length > 0 ? `${existing.join('\n')}\n${line}` : line
}

/**
 * Befüllt nur leere Initiativ-Felder aus Extrakt (überschreibt User-Text nicht).
 * `force` = auch befüllte Felder ersetzen (Button „Infos übernehmen“).
 */
export function applyExtractedCompanyContext(
  current: InitiativeFillableFields,
  extracted: ExtractedCompanyContext,
  options: { force?: boolean } = {},
): InitiativeFillableFields & { filledKeys: string[] } {
  const force = options.force === true
  const filledKeys: string[] = []
  let next = { ...current }

  if ((force || !next.company_info.trim()) && extracted.companyInfo) {
    next.company_info = extracted.companyInfo
    filledKeys.push('company_info')
  }

  if ((force || !next.target_notes.trim()) && extracted.targetNotes) {
    next.target_notes = extracted.targetNotes
    filledKeys.push('target_notes')
  }

  if (extracted.contactNotes) {
    if (force || !next.notes.trim()) {
      next.notes = force
        ? mergeContactIntoNotes(
            next.notes
              .split('\n')
              .filter((l) => !/^(kontakt|e-mail)\s*:/i.test(l.trim()))
              .join('\n')
              .trim(),
            extracted.contactNotes,
          )
        : extracted.contactNotes
      filledKeys.push('notes')
    } else if (!force) {
      const merged = mergeContactIntoNotes(next.notes, extracted.contactNotes)
      if (merged !== next.notes.trim()) {
        next.notes = merged
        filledKeys.push('notes')
      }
    }
  }

  if (extracted.companyUrl) {
    const before = next.linksText
    next.linksText = mergeCompanyUrlIntoLinks(
      force ? next.linksText : next.linksText,
      extracted.companyUrl,
    )
    // force: URL trotzdem nur ergänzen, nicht Links löschen
    if (next.linksText !== before) filledKeys.push('links')
  }

  return { ...next, filledKeys }
}

/** Shortcut: Extrahieren + leere Felder befüllen. */
export function fillInitiativeFieldsFromJobText(
  current: InitiativeFillableFields,
  options: { force?: boolean } = {},
): InitiativeFillableFields & {
  filledKeys: string[]
  extracted: ExtractedCompanyContext
} {
  const extracted = extractCompanyContextFromJobText(current.job_description, {
    title: current.title,
    sourceUrl: current.source_url,
    companyName: current.company_name,
  })
  const applied = applyExtractedCompanyContext(current, extracted, options)
  return { ...applied, extracted }
}

export function companyUrlLink(url: string): JobPoolLink {
  return { label: 'Unternehmen', url }
}
