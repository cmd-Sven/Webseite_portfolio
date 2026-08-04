/**
 * Pragmatischer E-Mail-Versand ohne SMTP/Resend:
 * Öffnet den Standard-Mail-Client via mailto: mit Betreff + Anschreiben.
 * PDFs müssen manuell angehängt werden (mailto unterstützt keine Attachments).
 */

export type MailtoPrepareInput = {
  to?: string | null
  companyName: string
  jobTitle: string
  coverLetter?: string | null
  candidateName?: string | null
}

export function buildApplicationMailto(input: MailtoPrepareInput): {
  href: string
  subject: string
  body: string
} {
  const company = input.companyName.trim() || 'Unternehmen'
  const job = input.jobTitle.trim() || 'Stelle'
  const subject = `Bewerbung als ${job} – ${company}`

  const bodyParts: string[] = []
  if (input.coverLetter?.trim()) {
    bodyParts.push(input.coverLetter.trim())
  } else {
    let fallback = `Sehr geehrte Damen und Herren,\n\nich bewerbe mich als ${job} bei ${company}.\n\nMit freundlichen Grüßen`
    if (input.candidateName?.trim()) {
      fallback += `\n${input.candidateName.trim()}`
    }
    bodyParts.push(fallback)
  }
  bodyParts.push(
    '',
    '---',
    'Hinweis: Bitte Anschreiben-PDF und CV manuell als Anhang hinzufügen (mailto unterstützt keine Dateianhänge).',
  )

  const body = bodyParts.join('\n')
  const params = new URLSearchParams()
  params.set('subject', subject)
  params.set('body', body)

  const to = input.to?.trim() ?? ''
  const href = to ? `mailto:${to}?${params.toString()}` : `mailto:?${params.toString()}`

  return { href, subject, body }
}

export function openApplicationMailto(input: MailtoPrepareInput): {
  opened: boolean
  href: string
  error: string | null
} {
  try {
    const { href } = buildApplicationMailto(input)
    window.location.href = href
    return { opened: true, href, error: null }
  } catch (err) {
    return {
      opened: false,
      href: '',
      error: err instanceof Error ? err.message : 'mailto konnte nicht geöffnet werden',
    }
  }
}
