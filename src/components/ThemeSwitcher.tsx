import { Contrast, Moon, Sun } from 'lucide-react'
import { useTheme, type Appearance } from '../context/ThemeContext'

const MODES: { id: Appearance; label: string; short: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark Mode', short: 'Dark', icon: Moon },
  { id: 'light', label: 'Light Mode', short: 'Light', icon: Sun },
  { id: 'contrast', label: 'Kontrastmodus (barrierefrei)', short: 'Kontrast', icon: Contrast },
]

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { appearance, setAppearance } = useTheme()

  return (
    <div
      className="theme-switcher flex items-center gap-0.5 p-0.5 rounded-full border"
      role="group"
      aria-label="Darstellungsmodus wählen"
    >
      {MODES.map(({ id, label, short, icon: Icon }) => {
        const active = appearance === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setAppearance(id)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`theme-switcher__btn flex items-center gap-1 rounded-full font-mono font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              compact ? 'px-2 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[10px]'
            } ${active ? 'theme-switcher__btn--active' : ''}`}
          >
            <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden />
            <span className={compact ? 'hidden sm:inline' : ''}>{short}</span>
          </button>
        )
      })}
    </div>
  )
}
