/** Cross-origin Job-Pool-Import via Bookmarklet → postMessage → /admin/pool. */

export const ATS_POOL_BOOKMARKLET_STORAGE_KEY = 'ats_bookmarklet_pool'
export const ATS_POOL_JOB_MESSAGE_TYPE = 'ATS_POOL_JOB'
export const ATS_POOL_JOB_ACK_TYPE = 'ATS_POOL_JOB_ACK'
export const ATS_POOL_BOOKMARKLET_EVENT = 'ats:bookmarklet-pool-job'
/** Clipboard-Marker (Bookmarklet schreibt JSON dahinter). */
export const ATS_POOL_CLIPBOARD_PREFIX = 'ATS_POOL_JOB_V1:'
/** URL-Hash-Backup (gekürzt). */
export const ATS_POOL_HASH_PREFIX = '#ats_pool='

export interface AtsPoolBookmarkletPayload {
  text: string
  title: string
  url: string
  company?: string
  receivedAt: number
}

export interface AtsPoolJobMessage {
  type: typeof ATS_POOL_JOB_MESSAGE_TYPE
  text?: unknown
  title?: unknown
  url?: unknown
  company?: unknown
}

const MAX_TEXT_CHARS = 120_000
/** Hash-Backup: Text gekürzt, damit die URL unter typischen Limits bleibt. */
const HASH_MAX_TEXT_CHARS = 4_000

export function isAtsPoolJobMessage(data: unknown): data is AtsPoolJobMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as AtsPoolJobMessage).type === ATS_POOL_JOB_MESSAGE_TYPE
  )
}

export function normalizePoolBookmarkletPayload(
  data: AtsPoolJobMessage,
): AtsPoolBookmarkletPayload | null {
  const text = typeof data.text === 'string' ? data.text.trim() : ''
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const url = typeof data.url === 'string' ? data.url.trim() : ''
  const company = typeof data.company === 'string' ? data.company.trim() : ''

  if (!text && !title && !url) return null

  return {
    text: text.slice(0, MAX_TEXT_CHARS),
    title,
    url,
    company: company || undefined,
    receivedAt: Date.now(),
  }
}

let memoryPayload: AtsPoolBookmarkletPayload | null = null

export function savePoolBookmarkletPayload(payload: AtsPoolBookmarkletPayload): void {
  memoryPayload = payload
  try {
    sessionStorage.setItem(ATS_POOL_BOOKMARKLET_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota / private mode – Import gilt nur für die aktuelle Seite
  }
  window.dispatchEvent(new CustomEvent(ATS_POOL_BOOKMARKLET_EVENT, { detail: payload }))
}

export function loadPoolBookmarkletPayload(): AtsPoolBookmarkletPayload | null {
  if (memoryPayload) return memoryPayload
  try {
    const raw = sessionStorage.getItem(ATS_POOL_BOOKMARKLET_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AtsPoolBookmarkletPayload>
    if (typeof parsed !== 'object' || parsed === null) return null
    const payload: AtsPoolBookmarkletPayload = {
      text: typeof parsed.text === 'string' ? parsed.text : '',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      url: typeof parsed.url === 'string' ? parsed.url : '',
      company: typeof parsed.company === 'string' ? parsed.company : undefined,
      receivedAt: typeof parsed.receivedAt === 'number' ? parsed.receivedAt : Date.now(),
    }
    memoryPayload = payload
    return payload
  } catch {
    return null
  }
}

export function clearPoolBookmarkletPayload(): void {
  try {
    sessionStorage.removeItem(ATS_POOL_BOOKMARKLET_STORAGE_KEY)
  } catch {
    // ignore
  }
  const snapshot = memoryPayload
  window.setTimeout(() => {
    if (memoryPayload === snapshot) memoryPayload = null
  }, 50)
}

/** Payload einmalig beanspruchen und Storage sofort leeren (StrictMode-sicher). */
const consumedReceivedAts = new Set<number>()

export function claimPoolBookmarkletPayload(
  payload: AtsPoolBookmarkletPayload,
): boolean {
  if (consumedReceivedAts.has(payload.receivedAt)) return false
  consumedReceivedAts.add(payload.receivedAt)
  memoryPayload = null
  try {
    sessionStorage.removeItem(ATS_POOL_BOOKMARKLET_STORAGE_KEY)
  } catch {
    // ignore
  }
  return true
}

/** Best-effort Firmenname aus URL-Hostname. */
export function guessCompanyFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '')
    if (!host) return ''
    const base = host.split('.')[0] ?? ''
    if (base.length < 2 || base.length > 40) return ''
    return base.charAt(0).toUpperCase() + base.slice(1)
  } catch {
    return ''
  }
}

/** Unicode-sicheres Base64 (Browser). */
export function encodeUtf8Base64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)))
}

export function decodeUtf8Base64(value: string): string {
  return decodeURIComponent(escape(atob(value)))
}

/** Kompaktes Hash-Backup für URL (Titel/URL + gekürzter Text). */
export function encodePoolBookmarkletHash(
  payload: Pick<AtsPoolBookmarkletPayload, 'text' | 'title' | 'url' | 'company'>,
): string {
  const compact = {
    type: ATS_POOL_JOB_MESSAGE_TYPE,
    title: payload.title.slice(0, 300),
    url: payload.url.slice(0, 2_000),
    company: (payload.company ?? '').slice(0, 120),
    text: payload.text.slice(0, HASH_MAX_TEXT_CHARS),
  }
  return `${ATS_POOL_HASH_PREFIX}${encodeURIComponent(encodeUtf8Base64(JSON.stringify(compact)))}`
}

export function parsePoolBookmarkletHash(
  hash: string,
): AtsPoolBookmarkletPayload | null {
  if (!hash || !hash.startsWith(ATS_POOL_HASH_PREFIX)) return null
  try {
    const encoded = decodeURIComponent(hash.slice(ATS_POOL_HASH_PREFIX.length))
    const json = decodeUtf8Base64(encoded)
    const parsed = JSON.parse(json) as unknown
    if (!isAtsPoolJobMessage(parsed)) return null
    return normalizePoolBookmarkletPayload(parsed)
  } catch {
    return null
  }
}

/** Hash lesen und aus der Adresszeile entfernen. */
export function consumePoolBookmarkletHash(): AtsPoolBookmarkletPayload | null {
  if (typeof window === 'undefined') return null
  const payload = parsePoolBookmarkletHash(window.location.hash)
  if (!payload) return null
  try {
    const url = new URL(window.location.href)
    url.hash = ''
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  } catch {
    // ignore
  }
  return payload
}

export function parsePoolBookmarkletClipboard(
  raw: string,
): AtsPoolBookmarkletPayload | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith(ATS_POOL_CLIPBOARD_PREFIX)) return null
  try {
    const parsed = JSON.parse(trimmed.slice(ATS_POOL_CLIPBOARD_PREFIX.length)) as unknown
    if (!isAtsPoolJobMessage(parsed)) return null
    return normalizePoolBookmarkletPayload(parsed)
  } catch {
    return null
  }
}

/** Roher Stellen-Text (manuell kopiert) → Import-Payload. */
export function payloadFromPlainJobText(raw: string): AtsPoolBookmarkletPayload | null {
  const text = raw.trim()
  if (text.length < 20) return null
  const firstLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length >= 3) ?? 'Stelle (Zwischenablage)'
  return {
    text: text.slice(0, MAX_TEXT_CHARS),
    title: firstLine.slice(0, 180),
    url: '',
    receivedAt: Date.now(),
  }
}

/**
 * Zwischenablage auswerten: zuerst Bookmarklet-JSON, sonst Rohtext.
 * `allowPlain` für den manuellen „Importieren“-Button (nicht für Auto-Import).
 */
export function payloadFromClipboardText(
  raw: string,
  options: { allowPlain?: boolean } = {},
): AtsPoolBookmarkletPayload | null {
  const structured = parsePoolBookmarkletClipboard(raw)
  if (structured) return structured
  if (options.allowPlain) return payloadFromPlainJobText(raw)
  return null
}

export async function readPoolBookmarkletFromClipboard(
  options: { allowPlain?: boolean } = {},
): Promise<AtsPoolBookmarkletPayload | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return null
  try {
    const raw = await navigator.clipboard.readText()
    return payloadFromClipboardText(raw, options)
  } catch {
    return null
  }
}

export type PoolBookmarkletTargetPath = '/admin/pool' | '/monitor'

/**
 * javascript:-Bookmarklet. Embeddet die aktuelle Portfolio-Origin,
 * damit lokal und auf Vercel dieselbe Lesezeichen-Zeile funktioniert.
 *
 * Primär: postMessage. Fallback: Clipboard + gekürzter URL-Hash
 * (Chrome speichert oft die Seite statt javascript:-Links).
 *
 * `targetPath`: Admin → `/admin/pool`, Monitor (Caro) → `/monitor`.
 */
export function buildPoolBookmarkletHref(
  origin: string,
  targetPath: PoolBookmarkletTargetPath = '/admin/pool',
): string {
  const o = JSON.stringify(origin.replace(/\/$/, ''))
  const path = JSON.stringify(targetPath)
  const max = String(MAX_TEXT_CHARS)
  const hashMax = String(HASH_MAX_TEXT_CHARS)
  const msgType = JSON.stringify(ATS_POOL_JOB_MESSAGE_TYPE)
  const ackType = JSON.stringify(ATS_POOL_JOB_ACK_TYPE)
  const clipPrefix = JSON.stringify(ATS_POOL_CLIPBOARD_PREFIX)
  const hashPrefix = JSON.stringify(ATS_POOL_HASH_PREFIX)

  const body = [
    '(function(){',
    `var O=${o};`,
    `var P=${path};`,
    `var MT=${msgType};`,
    `var AT=${ackType};`,
    `var CP=${clipPrefix};`,
    `var HP=${hashPrefix};`,
    'var sel="";',
    'try{sel=(window.getSelection&&window.getSelection().toString())||""}catch(e){}',
    'var text=(sel&&sel.trim())||"";',
    'if(!text||text.length<40){',
    'try{text=(document.body&&(document.body.innerText||document.body.textContent))||""}catch(e){text=""}',
    '}',
    `text=String(text||"").trim().slice(0,${max});`,
    'var payload={type:MT,text:text,title:document.title||"",url:location.href||"",company:""};',
    'try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(CP+JSON.stringify(payload))}}catch(e){}',
    'var hash="";',
    'try{',
    `var compact={type:MT,title:String(payload.title||"").slice(0,300),url:String(payload.url||"").slice(0,2000),company:"",text:text.slice(0,${hashMax})};`,
    'hash=HP+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compact)))));',
    '}catch(e){}',
    'var target=O+P+"?from=bookmarklet&import=clipboard"+hash;',
    'var w=window.open(target,"_blank");',
    'if(!w){alert("Popup blockiert. Bitte Popups fuer diese Seite erlauben und erneut klicken.");return;}',
    'var tries=0,maxTries=80,acked=false,timer;',
    'function send(){if(acked)return;tries++;try{w.postMessage(payload,O)}catch(e){}if(tries>=maxTries){clearInterval(timer);if(!acked){try{alert("Pool geoeffnet, aber kein Empfang bestaetigt. Wenn nichts importiert wurde: Bookmarklet neu anlegen (Code kopieren) oder auf der Pool-Seite \\"Zwischenablage importieren\\" klicken.")}catch(e){}}}}',
    'function onMsg(ev){',
    'if(ev.origin!==O)return;',
    'if(ev.data&&ev.data.type===AT){acked=true;clearInterval(timer);window.removeEventListener("message",onMsg)}',
    '}',
    'window.addEventListener("message",onMsg);',
    'setTimeout(function(){timer=setInterval(send,250);send()},400);',
    '})();',
  ].join('')

  return `javascript:${body}`
}
