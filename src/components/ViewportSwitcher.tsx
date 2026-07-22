import { Laptop, Monitor, Smartphone } from 'lucide-react'
import { useViewport, type ViewportMode } from '../context/ViewportContext'

const MODES: { id: ViewportMode; label: string; short: string; icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop-Ansicht', short: 'Desktop', icon: Monitor },
  { id: 'laptop', label: 'Laptop-Ansicht (1280px)', short: 'Laptop', icon: Laptop },
  { id: 'mobile', label: 'Mobile-Ansicht (390px)', short: 'Mobile', icon: Smartphone },
]

export function ViewportSwitcher({ compact = false }: { compact?: boolean }) {
  const { viewport, setViewport } = useViewport()

  return (
    <div
      className="viewport-switcher flex items-center gap-0.5 p-0.5 rounded-full border"
      role="group"
      aria-label="Geräteansicht wählen"
    >
      {MODES.map(({ id, label, short, icon: Icon }) => {
        const active = viewport === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setViewport(id)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`viewport-switcher__btn flex items-center gap-1 rounded-full font-mono font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              compact ? 'px-2 py-1 text-[9px]' : 'px-2.5 py-1.5 text-[10px]'
            } ${active ? 'viewport-switcher__btn--active' : ''}`}
          >
            <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden />
            <span className={compact ? 'hidden xl:inline' : ''}>{short}</span>
          </button>
        )
      })}
    </div>
  )
}
