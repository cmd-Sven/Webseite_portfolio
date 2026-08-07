import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CalendarPlus, Loader2, Paperclip, X } from 'lucide-react'
import { markManuallySent } from '../../lib/atsApi'
import type { ApplicationRow } from '../../types/ats'

function todayLocalYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function followUpLabel(sentYmd: string): string {
  const [y, m, d] = sentYmd.split('-').map(Number)
  const base = new Date(y, (m ?? 1) - 1, d ?? 1)
  base.setDate(base.getDate() + 14)
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
  }).format(base)
}

type Props = {
  open: boolean
  application: ApplicationRow
  userId: string
  onClose: () => void
  onDone: (result: {
    application: ApplicationRow
    filename: string | null
    uploaded: number
  }) => void
  onError: (message: string) => void
}

export function ManualSentDialog({
  open,
  application,
  userId,
  onClose,
  onDone,
  onError,
}: Props) {
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sentDate, setSentDate] = useState(todayLocalYmd)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setSentDate(todayLocalYmd())
    setFiles([])
    setSubmitting(false)
  }, [open, application.id])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!sentDate) {
      onError('Bitte ein Versanddatum wählen')
      return
    }

    setSubmitting(true)
    const { data, filename, uploaded, error } = await markManuallySent(application, {
      userId,
      sentAt: sentDate,
      files,
    })
    setSubmitting(false)

    if (error || !data) {
      onError(error || 'Markieren fehlgeschlagen')
      return
    }

    onDone({ application: data, filename, uploaded })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/40 p-4"
      role="presentation"
      onClick={() => {
        if (!submitting) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <div className="min-w-0 space-y-0.5">
            <h2 id={titleId} className="text-sm font-semibold text-zinc-900">
              Manuell versendet
            </h2>
            <p className="text-xs text-zinc-500 truncate">
              {application.job_title} · {application.company_name}
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 py-4">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Ohne KI-Dokumente. Speichert Versanddatum, setzt Status auf „Beworben“ und lädt
            eine .ics mit Absende + Follow-up in 14 Tagen.
          </p>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Versendet am</span>
            <input
              type="date"
              required
              value={sentDate}
              max={todayLocalYmd()}
              disabled={submitting}
              onChange={(e) => setSentDate(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-60"
            />
            {sentDate && (
              <span className="block text-xs text-zinc-400">
                Follow-up-Erinnerung: {followUpLabel(sentDate)}
              </span>
            )}
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-600">
                Unterlagen (optional)
              </span>
              <button
                type="button"
                disabled={submitting}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
              >
                <Paperclip className="w-3.5 h-3.5" aria-hidden />
                Dateien wählen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,text/plain"
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files ?? [])
                  if (list.length === 0) return
                  setFiles((prev) => [...prev, ...list])
                  e.target.value = ''
                }}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              PDF, DOC/DOCX, Bilder oder TXT — z. B. Anschreiben/CV, die du manuell verschickt hast.
            </p>
            {files.length > 0 && (
              <ul className="space-y-1.5 rounded-md border border-zinc-100 bg-zinc-50 px-2.5 py-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-2 text-xs text-zinc-700"
                  >
                    <span className="truncate min-w-0">{file.name}</span>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="shrink-0 text-zinc-400 hover:text-zinc-700 disabled:opacity-50"
                      aria-label={`${file.name} entfernen`}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting || !sentDate}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3.5 py-2 text-sm text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <CalendarPlus className="w-4 h-4" aria-hidden />
              )}
              Als versendet markieren
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
