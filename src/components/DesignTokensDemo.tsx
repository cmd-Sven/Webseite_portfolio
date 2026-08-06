import { Contrast, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useTheme, type Appearance } from '../context/ThemeContext'

const MODES: { id: Appearance; label: string; icon: typeof Moon }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'contrast', label: 'Kontrast', icon: Contrast },
]

const TOKEN_ROWS: { name: string; cssVar: string }[] = [
  { name: 'surface-elevated', cssVar: '--demo-surface' },
  { name: 'text-primary', cssVar: '--demo-text' },
  { name: 'border-subtle', cssVar: '--demo-border' },
  { name: 'accent', cssVar: '--demo-accent' },
]

export function DesignTokensDemo() {
  const { setAppearance } = useTheme()
  const [preview, setPreview] = useState<Appearance>('dark')

  return (
    <aside
      className="design-tokens-demo rounded-2xl border p-4 space-y-3"
      data-appearance={preview}
      aria-label="Interaktive Design-Token-Demo"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-mono uppercase tracking-wider design-tokens-demo__label">
          Live-Preview · semantic tokens
        </p>
        <div
          className="design-tokens-demo__switcher flex items-center gap-0.5 p-0.5 rounded-full border"
          role="group"
          aria-label="Vorschau-Modus wählen"
        >
          {MODES.map(({ id, label, icon: Icon }) => {
            const active = preview === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPreview(id)}
                aria-pressed={active}
                aria-label={`${label}-Vorschau`}
                className={`design-tokens-demo__btn flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-mono font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                  active ? 'design-tokens-demo__btn--active' : ''
                }`}
              >
                <Icon className="w-3 h-3" aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="design-tokens-demo__card rounded-xl border p-4 space-y-3 transition-colors duration-300">
        <h4 className="text-sm font-bold tracking-tight">Surface Card</h4>
        <p className="text-xs leading-relaxed design-tokens-demo__muted">
          Dieselbe Komponente – nur die Token-Werte wechseln. Kein Umbau der Card nötig.
        </p>
        <div className="flex flex-wrap gap-2">
          {TOKEN_ROWS.map(({ name, cssVar }) => (
            <span
              key={name}
              className="design-tokens-demo__chip inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-mono"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm border shrink-0"
                style={{ background: `var(${cssVar})`, borderColor: 'var(--demo-border)' }}
                aria-hidden
              />
              {name}
            </span>
          ))}
        </div>
        <button type="button" className="design-tokens-demo__cta rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-90">
          Primäraktion
        </button>
      </div>

      <button
        type="button"
        onClick={() => setAppearance(preview)}
        className="design-tokens-demo__apply text-[10px] font-mono underline-offset-2 hover:underline"
      >
        Auf die ganze Seite anwenden →
      </button>
    </aside>
  )
}
