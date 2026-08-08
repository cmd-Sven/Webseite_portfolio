import { useEffect } from 'react'
import {
  ATS_COMPANY_ACK_TYPE,
  isAtsCompanyMessage,
  normalizeCompanyBookmarkletPayload,
  saveCompanyBookmarkletPayload,
} from '../../lib/atsCompanyBookmarklet'

/**
 * Globaler Empfänger für Firmen-Bookmarklet – auch vor Auth-Redirect aktiv.
 * Eigene Message-Types / Storage-Keys – berührt Job-Pool- und Bewerbungs-Bookmarklets nicht.
 */
export function AtsCompanyBookmarkletReceiver() {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isAtsCompanyMessage(event.data)) return

      const payload = normalizeCompanyBookmarkletPayload(event.data)
      if (!payload) return

      saveCompanyBookmarkletPayload(payload)

      try {
        const source = event.source as Window | null
        source?.postMessage({ type: ATS_COMPANY_ACK_TYPE }, event.origin)
      } catch {
        // Cross-window ACK optional
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return null
}
