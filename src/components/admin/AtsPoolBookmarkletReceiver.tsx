import { useEffect } from 'react'
import {
  ATS_POOL_JOB_ACK_TYPE,
  isAtsPoolJobMessage,
  normalizePoolBookmarkletPayload,
  savePoolBookmarkletPayload,
} from '../../lib/atsPoolBookmarklet'

/**
 * Globaler Empfänger für Pool-Bookmarklet – auch auf der Login-Seite aktiv,
 * damit postMessage den Import vor dem Auth-Redirect nicht verliert.
 * Eigene Message-Types / Storage-Keys – berührt das Bewerbungs-Bookmarklet nicht.
 */
export function AtsPoolBookmarkletReceiver() {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isAtsPoolJobMessage(event.data)) return

      const payload = normalizePoolBookmarkletPayload(event.data)
      if (!payload) return

      savePoolBookmarkletPayload(payload)

      try {
        const source = event.source as Window | null
        source?.postMessage({ type: ATS_POOL_JOB_ACK_TYPE }, event.origin)
      } catch {
        // Cross-window ACK optional
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return null
}
