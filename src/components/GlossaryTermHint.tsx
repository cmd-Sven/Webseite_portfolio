import { Info } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface GlossaryTermHintProps {
  term: string
  description: string
  /** Optional: abweichendes Label im Fließtext */
  children?: ReactNode
}

const VIEWPORT_PAD = 12
const GAP = 8

/** Info-Icon + Klick-Tooltip – gleiches UI wie Blog-Fachwörter. */
export function GlossaryTermHint({ term, description, children }: GlossaryTermHintProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; maxWidth: number } | null>(
    null,
  )
  const btnRef = useRef<HTMLButtonElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const tipId = useId()

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !tipRef.current) return

    const place = () => {
      const btn = btnRef.current
      const tip = tipRef.current
      if (!btn || !tip) return

      const rect = btn.getBoundingClientRect()
      const tipRect = tip.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const maxWidth = Math.min(288, vw - VIEWPORT_PAD * 2)

      let top = rect.bottom + GAP
      let left = rect.left + rect.width / 2 - tipRect.width / 2

      if (top + tipRect.height > vh - VIEWPORT_PAD) {
        top = rect.top - tipRect.height - GAP
      }
      if (top < VIEWPORT_PAD) {
        top = VIEWPORT_PAD
      }

      left = Math.max(VIEWPORT_PAD, Math.min(left, vw - tipRect.width - VIEWPORT_PAD))

      setCoords({ top, left, maxWidth })
    }

    place()
    const ro = new ResizeObserver(place)
    ro.observe(tipRef.current)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        btnRef.current?.focus()
      }
    }

    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || tipRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [open])

  return (
    <span className="blog-term-hint">
      <span className="blog-term-hint__label">{children ?? term}</span>
      <button
        ref={btnRef}
        type="button"
        className="blog-term-hint__btn"
        aria-label={`Erklärung zu ${term}`}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <Info className="blog-term-hint__icon" aria-hidden />
      </button>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            id={tipId}
            role="tooltip"
            className="blog-term-hint__tooltip"
            style={
              coords
                ? {
                    top: coords.top,
                    left: coords.left,
                    maxWidth: coords.maxWidth,
                    visibility: 'visible',
                  }
                : { visibility: 'hidden', top: 0, left: 0 }
            }
          >
            <strong className="blog-term-hint__tooltip-term">{term}</strong>
            <p className="blog-term-hint__tooltip-text">{description}</p>
          </div>,
          document.body,
        )}
    </span>
  )
}
