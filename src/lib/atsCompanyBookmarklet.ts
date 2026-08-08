/** Cross-origin Firmen-Import via Bookmarklet → postMessage → /admin/companies oder /monitor. */

import { guessCompanyFromUrl } from './atsPoolBookmarklet'

export const ATS_COMPANY_BOOKMARKLET_STORAGE_KEY = 'ats_bookmarklet_company'
export const ATS_COMPANY_MESSAGE_TYPE = 'ATS_COMPANY'
export const ATS_COMPANY_ACK_TYPE = 'ATS_COMPANY_ACK'
export const ATS_COMPANY_BOOKMARKLET_EVENT = 'ats:bookmarklet-company'
export const ATS_COMPANY_CLIPBOARD_PREFIX = 'ATS_COMPANY_V1:'
export const ATS_COMPANY_HASH_PREFIX = '#ats_company='

export interface AtsCompanyBookmarkletPayload {
  name: string
  url: string
  title: string
  notes: string
  receivedAt: number
}

export interface AtsCompanyMessage {
  type: typeof ATS_COMPANY_MESSAGE_TYPE
  name?: unknown
  url?: unknown
  title?: unknown
  notes?: unknown
}

const MAX_NOTES_CHARS = 8_000
const HASH_MAX_NOTES_CHARS = 2_000

export function isAtsCompanyMessage(data: unknown): data is AtsCompanyMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as AtsCompanyMessage).type === ATS_COMPANY_MESSAGE_TYPE
  )
}

export function resolveCompanyImportFields(payload: {
  name?: string
  url?: string
  title?: string
  notes?: string
}): { name: string; website_url: string; notes: string } {
  const url = (payload.url ?? '').trim()
  const title = (payload.title ?? '').trim()
  const name =
    (payload.name ?? '').trim() ||
    guessCompanyFromUrl(url) ||
    title.split(/[|\-–—·•]/)[0]?.trim() ||
    title ||
    'Unternehmen'
  const notes = (payload.notes ?? '').trim()
  return {
    name: name.slice(0, 180),
    website_url: url,
    notes: notes.slice(0, MAX_NOTES_CHARS),
  }
}

export function normalizeCompanyBookmarkletPayload(
  data: AtsCompanyMessage,
): AtsCompanyBookmarkletPayload | null {
  const url = typeof data.url === 'string' ? data.url.trim() : ''
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  const nameRaw = typeof data.name === 'string' ? data.name.trim() : ''
  const notes = typeof data.notes === 'string' ? data.notes.trim() : ''

  if (!url && !title && !nameRaw) return null

  const resolved = resolveCompanyImportFields({
    name: nameRaw,
    url,
    title,
    notes,
  })

  return {
    name: resolved.name,
    url: resolved.website_url,
    title,
    notes: resolved.notes,
    receivedAt: Date.now(),
  }
}

let memoryPayload: AtsCompanyBookmarkletPayload | null = null

export function saveCompanyBookmarkletPayload(
  payload: AtsCompanyBookmarkletPayload,
): void {
  memoryPayload = payload
  try {
    sessionStorage.setItem(ATS_COMPANY_BOOKMARKLET_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota / private mode
  }
  window.dispatchEvent(new CustomEvent(ATS_COMPANY_BOOKMARKLET_EVENT, { detail: payload }))
}

export function loadCompanyBookmarkletPayload(): AtsCompanyBookmarkletPayload | null {
  if (memoryPayload) return memoryPayload
  try {
    const raw = sessionStorage.getItem(ATS_COMPANY_BOOKMARKLET_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AtsCompanyBookmarkletPayload>
    if (typeof parsed !== 'object' || parsed === null) return null
    const payload: AtsCompanyBookmarkletPayload = {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      url: typeof parsed.url === 'string' ? parsed.url : '',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      receivedAt: typeof parsed.receivedAt === 'number' ? parsed.receivedAt : Date.now(),
    }
    memoryPayload = payload
    return payload
  } catch {
    return null
  }
}

export function clearCompanyBookmarkletPayload(): void {
  try {
    sessionStorage.removeItem(ATS_COMPANY_BOOKMARKLET_STORAGE_KEY)
  } catch {
    // ignore
  }
  const snapshot = memoryPayload
  window.setTimeout(() => {
    if (memoryPayload === snapshot) memoryPayload = null
  }, 50)
}

const consumedReceivedAts = new Set<number>()

export function claimCompanyBookmarkletPayload(
  payload: AtsCompanyBookmarkletPayload,
): boolean {
  if (consumedReceivedAts.has(payload.receivedAt)) return false
  consumedReceivedAts.add(payload.receivedAt)
  memoryPayload = null
  try {
    sessionStorage.removeItem(ATS_COMPANY_BOOKMARKLET_STORAGE_KEY)
  } catch {
    // ignore
  }
  return true
}

function encodeUtf8Base64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)))
}

function decodeUtf8Base64(value: string): string {
  return decodeURIComponent(escape(atob(value)))
}

export function encodeCompanyBookmarkletHash(
  payload: Pick<AtsCompanyBookmarkletPayload, 'name' | 'url' | 'title' | 'notes'>,
): string {
  const compact = {
    type: ATS_COMPANY_MESSAGE_TYPE,
    name: payload.name.slice(0, 180),
    url: payload.url.slice(0, 2_000),
    title: payload.title.slice(0, 300),
    notes: payload.notes.slice(0, HASH_MAX_NOTES_CHARS),
  }
  return `${ATS_COMPANY_HASH_PREFIX}${encodeURIComponent(encodeUtf8Base64(JSON.stringify(compact)))}`
}

export function parseCompanyBookmarkletHash(
  hash: string,
): AtsCompanyBookmarkletPayload | null {
  if (!hash || !hash.startsWith(ATS_COMPANY_HASH_PREFIX)) return null
  try {
    const encoded = decodeURIComponent(hash.slice(ATS_COMPANY_HASH_PREFIX.length))
    const json = decodeUtf8Base64(encoded)
    const parsed = JSON.parse(json) as unknown
    if (!isAtsCompanyMessage(parsed)) return null
    return normalizeCompanyBookmarkletPayload(parsed)
  } catch {
    return null
  }
}

export function consumeCompanyBookmarkletHash(): AtsCompanyBookmarkletPayload | null {
  if (typeof window === 'undefined') return null
  const payload = parseCompanyBookmarkletHash(window.location.hash)
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

export function parseCompanyBookmarkletClipboard(
  raw: string,
): AtsCompanyBookmarkletPayload | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith(ATS_COMPANY_CLIPBOARD_PREFIX)) return null
  try {
    const parsed = JSON.parse(
      trimmed.slice(ATS_COMPANY_CLIPBOARD_PREFIX.length),
    ) as unknown
    if (!isAtsCompanyMessage(parsed)) return null
    return normalizeCompanyBookmarkletPayload(parsed)
  } catch {
    return null
  }
}

export async function readCompanyBookmarkletFromClipboard(): Promise<AtsCompanyBookmarkletPayload | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) return null
  try {
    const raw = await navigator.clipboard.readText()
    return parseCompanyBookmarkletClipboard(raw)
  } catch {
    return null
  }
}

export type CompanyBookmarkletTargetPath = '/admin/companies' | '/monitor'

/**
 * javascript:-Bookmarklet für Unternehmensseiten.
 * Capture: URL, Domain→Name, Title, Selection→Notizen.
 *
 * Admin → `/admin/companies` (interessantes Unternehmen anlegen)
 * Monitor → `/monitor` (Vorschlag vorausfüllen)
 */
export function buildCompanyBookmarkletHref(
  origin: string,
  targetPath: CompanyBookmarkletTargetPath = '/admin/companies',
): string {
  const o = JSON.stringify(origin.replace(/\/$/, ''))
  const path = JSON.stringify(targetPath)
  const notesMax = String(MAX_NOTES_CHARS)
  const hashNotesMax = String(HASH_MAX_NOTES_CHARS)
  const msgType = JSON.stringify(ATS_COMPANY_MESSAGE_TYPE)
  const ackType = JSON.stringify(ATS_COMPANY_ACK_TYPE)
  const clipPrefix = JSON.stringify(ATS_COMPANY_CLIPBOARD_PREFIX)
  const hashPrefix = JSON.stringify(ATS_COMPANY_HASH_PREFIX)
  const fromParam =
    targetPath === '/monitor'
      ? JSON.stringify('company-bookmarklet')
      : JSON.stringify('bookmarklet')

  const body = [
    '(function(){',
    `var O=${o};`,
    `var P=${path};`,
    `var FP=${fromParam};`,
    `var MT=${msgType};`,
    `var AT=${ackType};`,
    `var CP=${clipPrefix};`,
    `var HP=${hashPrefix};`,
    'var sel="";',
    'try{sel=(window.getSelection&&window.getSelection().toString())||""}catch(e){}',
    `var notes=String(sel||"").trim().slice(0,${notesMax});`,
    'var url=location.href||"";',
    'var title=document.title||"";',
    'var name="";',
    'try{',
    'var host=(new URL(url)).hostname.replace(/^www\\./i,"");',
    'var base=host.split(".")[0]||"";',
    'if(base.length>=2&&base.length<=40){name=base.charAt(0).toUpperCase()+base.slice(1)}',
    '}catch(e){}',
    'var payload={type:MT,name:name,url:url,title:title,notes:notes};',
    'try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(CP+JSON.stringify(payload))}}catch(e){}',
    'var hash="";',
    'try{',
    `var compact={type:MT,name:String(name||"").slice(0,180),url:String(url||"").slice(0,2000),title:String(title||"").slice(0,300),notes:notes.slice(0,${hashNotesMax})};`,
    'hash=HP+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compact)))));',
    '}catch(e){}',
    'var target=O+P+"?from="+encodeURIComponent(FP)+"&import=clipboard"+hash;',
    'var w=window.open(target,"_blank");',
    'if(!w){alert("Popup blockiert. Bitte Popups fuer diese Seite erlauben und erneut klicken.");return;}',
    'var tries=0,maxTries=80,acked=false,timer;',
    'function send(){if(acked)return;tries++;try{w.postMessage(payload,O)}catch(e){}if(tries>=maxTries){clearInterval(timer);if(!acked){try{alert("Seite geoeffnet, aber kein Empfang bestaetigt. Bookmarklet neu anlegen oder Zwischenablage auf der Zielseite importieren.")}catch(e){}}}}',
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
