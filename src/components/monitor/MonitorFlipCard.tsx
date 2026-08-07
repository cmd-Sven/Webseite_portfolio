import { useState, type KeyboardEvent, type ReactNode } from 'react'

type MonitorFlipCardProps = {
  front: ReactNode
  back: ReactNode
  ariaLabel: string
}

/** Portrait-Spielkarte: ein Klick dreht Vorder-/Rückseite. */
export function MonitorFlipCard({ front, back, ariaLabel }: MonitorFlipCardProps) {
  const [flipped, setFlipped] = useState(false)

  function toggle() {
    setFlipped((v) => !v)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <div className="monitor-flip">
      <div
        role="button"
        tabIndex={0}
        className={[
          'monitor-flip__inner',
          flipped ? 'monitor-flip__inner--flipped' : '',
        ].join(' ')}
        aria-pressed={flipped}
        aria-label={`${ariaLabel} — ${flipped ? 'Vorderseite' : 'mehr Infos'} anzeigen`}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <div className="monitor-flip__face monitor-flip__face--front">{front}</div>
        <div className="monitor-flip__face monitor-flip__face--back">{back}</div>
      </div>
    </div>
  )
}
