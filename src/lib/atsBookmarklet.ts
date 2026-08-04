/** Cross-origin Job-Import via Bookmarklet → postMessage → Admin. */

export const ATS_BOOKMARKLET_STORAGE_KEY = 'ats_bookmarklet_job'
export const ATS_JOB_MESSAGE_TYPE = 'ATS_JOB'
export const ATS_JOB_ACK_TYPE = 'ATS_JOB_ACK'
export const ATS_BOOKMARKLET_EVENT = 'ats:bookmarklet-job'

export interface AtsBookmarkletPayload {
  text: string
  title: string
  url: string
  company?: string
  receivedAt: number
}

export interface AtsJobMessage {
  type: typeof ATS_JOB_MESSAGE_TYPE
  text?: unknown
  title?: unknown
  url?: unknown
  company?: unknown
}

const MAX_TEXT_CHARS = 120_000

export function isAtsJobMessage(data: unknown): data is AtsJobMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as AtsJobMessage).type === ATS_JOB_MESSAGE_TYPE
  )
}

export function normalizeBookmarkletPayload(
  data: AtsJobMessage,
): AtsBookmarkletPayload | null {
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

let memoryPayload: AtsBookmarkletPayload | null = null

export function saveBookmarkletPayload(payload: AtsBookmarkletPayload): void {
  memoryPayload = payload
  try {
    sessionStorage.setItem(ATS_BOOKMARKLET_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota / private mode – Import gilt nur für die aktuelle Seite
  }
  window.dispatchEvent(new CustomEvent(ATS_BOOKMARKLET_EVENT, { detail: payload }))
}

export function loadBookmarkletPayload(): AtsBookmarkletPayload | null {
  if (memoryPayload) return memoryPayload
  try {
    const raw = sessionStorage.getItem(ATS_BOOKMARKLET_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AtsBookmarkletPayload>
    if (typeof parsed !== 'object' || parsed === null) return null
    const payload: AtsBookmarkletPayload = {
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

export function clearBookmarkletPayload(): void {
  try {
    sessionStorage.removeItem(ATS_BOOKMARKLET_STORAGE_KEY)
  } catch {
    // ignore
  }
  // Memory erst verzögert leeren, damit React StrictMode-Remount den Import noch sieht
  const snapshot = memoryPayload
  window.setTimeout(() => {
    if (memoryPayload === snapshot) memoryPayload = null
  }, 50)
}


/** Guess company from common job-title patterns (best effort). */
export function guessCompanyFromTitle(title: string): string {
  const t = title.trim()
  if (!t) return ''
  const patterns = [
    /\s+[–—|-]\s+(.+)$/,
    /\s+bei\s+(.+)$/i,
    /\s+at\s+(.+)$/i,
    /\s+@\s+(.+)$/,
  ]
  for (const re of patterns) {
    const m = t.match(re)
    if (m?.[1]) {
      const candidate = m[1].replace(/\s*[|].*$/, '').trim()
      if (candidate.length >= 2 && candidate.length <= 80) return candidate
    }
  }
  return ''
}

/**
 * javascript:-Bookmarklet. Embeddet die aktuelle Portfolio-Origin,
 * damit lokal und auf Vercel dieselbe Lesezeichen-Zeile funktioniert.
 */
export function buildBookmarkletHref(origin: string): string {
  const o = JSON.stringify(origin.replace(/\/$/, ''))
  const max = String(MAX_TEXT_CHARS)
  const msgType = JSON.stringify(ATS_JOB_MESSAGE_TYPE)
  const ackType = JSON.stringify(ATS_JOB_ACK_TYPE)

  const body = [
    '(function(){',
    `var O=${o};`,
    `var MT=${msgType};`,
    `var AT=${ackType};`,
    'var sel="";',
    'try{sel=(window.getSelection&&window.getSelection().toString())||""}catch(e){}',
    'var text=(sel&&sel.trim())||"";',
    'if(!text||text.length<40){',
    'try{text=(document.body&&(document.body.innerText||document.body.textContent))||""}catch(e){text=""}',
    '}',
    `text=String(text||"").trim().slice(0,${max});`,
    'var payload={type:MT,text:text,title:document.title||"",url:location.href||"",company:""};',
    'var w=window.open(O+"/admin/new?from=bookmarklet","_blank");',
    'if(!w){alert("Popup blockiert. Bitte Popups fuer diese Seite erlauben und erneut klicken.");return;}',
    'var tries=0,maxTries=50,timer;',
    'function send(){tries++;try{w.postMessage(payload,O)}catch(e){}if(tries>=maxTries)clearInterval(timer)}',
    'function onMsg(ev){',
    'if(ev.origin!==O)return;',
    'if(ev.data&&ev.data.type===AT){clearInterval(timer);window.removeEventListener("message",onMsg)}',
    '}',
    'window.addEventListener("message",onMsg);',
    'timer=setInterval(send,400);',
    'send();',
    '})();',
  ].join('')

  return `javascript:${body}`
}
