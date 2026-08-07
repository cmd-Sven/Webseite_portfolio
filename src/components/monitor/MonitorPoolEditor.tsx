import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ExternalLink, Save, X } from 'lucide-react'
import type { JobPoolLink, JobPoolRow, JobPoolStatus } from '../../types/ats'
import { JOB_POOL_STATUSES } from '../../types/ats'
import { updateJobPoolEntry } from '../../lib/atsPoolApi'

const STATUS_LABEL: Record<JobPoolStatus, string> = {
  gesammelt: 'Gesammelt',
  geplant: 'Geplant',
  in_arbeit: 'In Arbeit',
  erledigt: 'Erledigt',
}

const TYPE_LABEL = {
  regular: 'Stelle (Regulär)',
  initiative: 'Initiativ',
} as const

type FormState = {
  title: string
  company_name: string
  status: JobPoolStatus
  source_url: string
  linksText: string
  notes: string
  job_description: string
  company_info: string
  target_notes: string
}

function linksToText(links: JobPoolLink[]): string {
  return links
    .map((link) => (link.label ? `${link.label} | ${link.url}` : link.url))
    .join('\n')
}

function parseLinksText(text: string): JobPoolLink[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf('|')
      if (sep >= 0) {
        const label = line.slice(0, sep).trim()
        const url = line.slice(sep + 1).trim()
        return url ? { url, ...(label ? { label } : {}) } : null
      }
      return { url: line }
    })
    .filter((item): item is JobPoolLink => item != null)
}

function rowToForm(row: JobPoolRow): FormState {
  return {
    title: row.title ?? '',
    company_name: row.company_name,
    status: row.status,
    source_url: row.source_url ?? '',
    linksText: linksToText(row.links),
    notes: row.notes ?? '',
    job_description: row.job_description ?? '',
    company_info: row.company_info ?? '',
    target_notes: row.target_notes ?? '',
  }
}

type MonitorPoolEditorProps = {
  entry: JobPoolRow
  onCancel: () => void
  onSaved: (row: JobPoolRow, notice: string) => void
}

/** Editierbare Job-Details — ohne Initiativ-/Bewerbungs-Conversion. */
export function MonitorPoolEditor({
  entry,
  onCancel,
  onSaved,
}: MonitorPoolEditorProps) {
  const [form, setForm] = useState<FormState>(() => rowToForm(entry))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm(rowToForm(entry))
    setError(null)
    titleRef.current?.focus()
  }, [entry])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.company_name.trim()) {
      setError('Firma ist erforderlich.')
      return
    }

    setSaving(true)
    setError(null)
    const { data, error: err } = await updateJobPoolEntry(entry.id, {
      title: form.title,
      company_name: form.company_name,
      status: form.status,
      source_url: form.source_url,
      links: parseLinksText(form.linksText),
      notes: form.notes,
      job_description: form.job_description,
      company_info: form.company_info,
      target_notes: form.target_notes,
    })
    setSaving(false)

    if (err || !data) {
      setError(err || 'Speichern fehlgeschlagen.')
      return
    }
    onSaved(data, 'Stelle aktualisiert.')
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="monitor-shell__panel p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Stelle bearbeiten</h2>
          <p className="mt-1 text-xs monitor-shell__muted">
            Typ:{' '}
            <span className="monitor-shell__badge">
              {TYPE_LABEL[entry.application_type]}
            </span>
            {' · '}
            nur lesen — Umschalten / Bewerbung anlegen nur Admin.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="monitor-shell__btn monitor-shell__btn--ghost !p-1.5"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--surface-border)' }}>
          {error}
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Titel</span>
        <input
          ref={titleRef}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="monitor-shell__input"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Firma *</span>
        <input
          required
          value={form.company_name}
          onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
          className="monitor-shell__input"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Status</span>
        <select
          value={form.status}
          onChange={(e) =>
            setForm((f) => ({ ...f, status: e.target.value as JobPoolStatus }))
          }
          className="monitor-shell__input"
        >
          {JOB_POOL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted inline-flex items-center gap-1">
          Quellen-Link
          {form.source_url.trim() && (
            <a
              href={form.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" aria-hidden />
            </a>
          )}
        </span>
        <input
          type="url"
          value={form.source_url}
          onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
          className="monitor-shell__input"
          placeholder="https://…"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Links (eine Zeile pro URL)</span>
        <textarea
          value={form.linksText}
          onChange={(e) => setForm((f) => ({ ...f, linksText: e.target.value }))}
          rows={2}
          className="monitor-shell__input resize-y"
          placeholder="Label | https://…"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Notizen</span>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="monitor-shell__input resize-y"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Stellenbeschreibung</span>
        <textarea
          value={form.job_description}
          onChange={(e) =>
            setForm((f) => ({ ...f, job_description: e.target.value }))
          }
          rows={5}
          className="monitor-shell__input resize-y font-mono text-[13px]"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Unternehmensinfos</span>
        <textarea
          value={form.company_info}
          onChange={(e) => setForm((f) => ({ ...f, company_info: e.target.value }))}
          rows={2}
          className="monitor-shell__input resize-y"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium monitor-shell__muted">Zielbereich</span>
        <textarea
          value={form.target_notes}
          onChange={(e) => setForm((f) => ({ ...f, target_notes: e.target.value }))}
          rows={2}
          className="monitor-shell__input resize-y"
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="monitor-shell__btn monitor-shell__btn--primary"
        >
          <Save className="w-4 h-4" aria-hidden />
          {saving ? 'Speichern …' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="monitor-shell__btn monitor-shell__btn--ghost"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
