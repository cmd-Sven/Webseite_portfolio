import { useEffect, useState, type RefObject } from 'react'
import { ArrowUp } from 'lucide-react'

const DEFAULT_THRESHOLD_PX = 320

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

interface ScrollToTopButtonProps {
  scrollContainerRef: RefObject<HTMLElement | null>
  /** Ab welchem Scroll-Offset der Button erscheint */
  threshold?: number
}

export function ScrollToTopButton({
  scrollContainerRef,
  threshold = DEFAULT_THRESHOLD_PX,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const sync = () => {
      setVisible(container.scrollTop > threshold)
    }

    sync()
    container.addEventListener('scroll', sync, { passive: true })
    return () => container.removeEventListener('scroll', sync)
  }, [scrollContainerRef, threshold])

  const scrollToTop = () => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  return (
    <button
      type="button"
      className="viewport-chrome-scroll-top scroll-to-top"
      data-visible={visible ? 'true' : 'false'}
      aria-label="Zum Seitenanfang"
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
      onClick={scrollToTop}
      {...(!visible ? { inert: true } : {})}
    >
      <span className="scroll-to-top__icon" aria-hidden>
        <ArrowUp className="scroll-to-top__svg" />
      </span>
    </button>
  )
}
