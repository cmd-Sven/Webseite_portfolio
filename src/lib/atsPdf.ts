import { supabase } from './supabaseClient'
import type { GeneratedCvData } from '../types/ats'

export type PdfExportMode = 'complete' | 'cover_letter' | 'cv'

export type GeneratePdfPayload = {
  company_name: string
  job_title: string
  cover_letter: string
  cv_data: GeneratedCvData
  candidate_name?: string
  candidate_email?: string
  /** complete | cover_letter | cv — default complete */
  mode?: PdfExportMode
}

/**
 * Ruft die Vercel-Serverless-Funktion `/api/generate-pdf` auf
 * (Puppeteer + @sparticuz/chromium). Lokal: `vercel dev`.
 */
export async function downloadApplicationPdf(
  payload: GeneratePdfPayload,
): Promise<{ error: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { error: 'Nicht angemeldet' }
  }

  const mode: PdfExportMode = payload.mode || 'complete'

  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...payload, mode }),
  })

  if (!response.ok) {
    let message = `PDF-Export fehlgeschlagen (${response.status})`
    try {
      const body = (await response.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // ignore
    }
    return { error: message }
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition')
  const match = disposition?.match(/filename="([^"]+)"/)
  const fallback =
    mode === 'cover_letter'
      ? 'Anschreiben.pdf'
      : mode === 'cv'
        ? 'Lebenslauf.pdf'
        : 'Bewerbung.pdf'
  const filename = match?.[1] || fallback

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)

  return { error: null }
}
