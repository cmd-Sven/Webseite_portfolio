import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ViewportMode = 'desktop' | 'laptop' | 'mobile'

export const VIEWPORT_WIDTHS: Record<ViewportMode, number | null> = {
  desktop: null,
  laptop: 1280,
  mobile: 390,
}

const STORAGE_KEY = 'portfolio-viewport'

interface ViewportContextValue {
  viewport: ViewportMode
  setViewport: (mode: ViewportMode) => void
  frameWidth: number | null
}

const ViewportContext = createContext<ViewportContextValue | null>(null)

function readStoredViewport(): ViewportMode {
  if (typeof window === 'undefined') return 'desktop'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'laptop' || stored === 'mobile' || stored === 'desktop') return stored
  return 'desktop'
}

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewportState] = useState<ViewportMode>(readStoredViewport)

  useEffect(() => {
    document.documentElement.setAttribute('data-viewport', viewport)
    localStorage.setItem(STORAGE_KEY, viewport)
  }, [viewport])

  const setViewport = useCallback((mode: ViewportMode) => {
    setViewportState(mode)
  }, [])

  const value = useMemo(
    () => ({
      viewport,
      setViewport,
      frameWidth: VIEWPORT_WIDTHS[viewport],
    }),
    [viewport, setViewport],
  )

  return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>
}

export function useViewport() {
  const ctx = useContext(ViewportContext)
  if (!ctx) throw new Error('useViewport must be used within ViewportProvider')
  return ctx
}
