import { useState } from 'react'
import { Flag, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { rewriteCoverBlock } from '../../lib/atsApi'
import type { CoverLetterBlock } from '../../lib/coverLetterBlocks'

type Props = {
  blocks: CoverLetterBlock[]
  onChange: (blocks: CoverLetterBlock[]) => void
  companyName: string
  jobTitle: string
}

export function CoverLetterBlockEditor({
  blocks,
  onChange,
  companyName,
  jobTitle,
}: Props) {
  const [rewritingId, setRewritingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateBlock(id: string, patch: Partial<CoverLetterBlock>) {
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)))
  }

  function removeBlock(id: string) {
    if (blocks.length <= 1) {
      onChange([{ id: 'block-0', text: '', marked: false }])
      return
    }
    onChange(blocks.filter((block) => block.id !== id))
  }

  function addBlock() {
    onChange([
      ...blocks,
      { id: `block-${Date.now()}`, text: '', marked: false },
    ])
  }

  async function handleRewrite(block: CoverLetterBlock) {
    if (!block.text.trim()) return
    setRewritingId(block.id)
    setError(null)

    const { data, error: rewriteError } = await rewriteCoverBlock({
      text: block.text,
      company_name: companyName,
      job_title: jobTitle,
      instruction: block.marked
        ? 'Diesen markierten Absatz besonders schärfen und natürlicher machen.'
        : undefined,
    })

    setRewritingId(null)

    if (rewriteError || !data) {
      setError(rewriteError || 'Rewrite fehlgeschlagen')
      return
    }

    updateBlock(block.id, { text: data.rewritten, marked: false })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 leading-relaxed">
        Absätze prüfen, markieren und bei Bedarf lokal per KI umschreiben. Änderungen werden
        erst mit „Speichern“ persistiert.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <ul className="space-y-3">
        {blocks.map((block, index) => (
          <li
            key={block.id}
            className={[
              'rounded-md border p-3 space-y-2',
              block.marked
                ? 'border-amber-300 bg-amber-50/60'
                : 'border-zinc-200 bg-zinc-50/40',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-400 font-medium">
                Absatz {index + 1}
                {block.marked ? ' · markiert' : ''}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateBlock(block.id, { marked: !block.marked })}
                  className={[
                    'inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
                    block.marked
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800',
                  ].join(' ')}
                  title="Zur Überprüfung markieren"
                >
                  <Flag className="w-3.5 h-3.5" aria-hidden />
                  Markieren
                </button>
                <button
                  type="button"
                  disabled={rewritingId === block.id || !block.text.trim()}
                  onClick={() => void handleRewrite(block)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
                  title="Absatz per KI umschreiben"
                >
                  {rewritingId === block.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" aria-hidden />
                  )}
                  KI anpassen
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-red-50 hover:text-red-700"
                  title="Absatz entfernen"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden />
                </button>
              </div>
            </div>
            <textarea
              value={block.text}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              rows={4}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
              aria-label={`Anschreiben Absatz ${index + 1}`}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addBlock}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden />
        Absatz hinzufügen
      </button>
    </div>
  )
}
