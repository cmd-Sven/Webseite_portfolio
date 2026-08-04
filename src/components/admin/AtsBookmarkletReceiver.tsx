import { useEffect } from 'react'
import {
  ATS_JOB_ACK_TYPE,
  isAtsJobMessage,
  normalizeBookmarkletPayload,
  saveBookmarkletPayload,
} from '../../lib/atsBookmarklet'

/**
 * Globaler Empfänger – auch auf der Login-Seite aktiv,
 * damit postMessage den Import vor dem Auth-Redirect nicht verliert.
 */
export function AtsBookmarkletReceiver() {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isAtsJobMessage(event.data)) return

      const payload = normalizeBookmarkletPayload(event.data)
      if (!payload) return

      saveBookmarkletPayload(payload)

      try {
        const source = event.source as Window | null
        source?.postMessage({ type: ATS_JOB_ACK_TYPE }, event.origin)
      } catch {
        // Cross-window ACK optional
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return null
}
