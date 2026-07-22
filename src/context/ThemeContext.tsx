import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Appearance = 'dark' | 'light' | 'contrast'

const STORAGE_KEY = 'portfolio-appearance'

interface ThemeContextValue {
  appearance: Appearance
  setAppearance: (mode: Appearance) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredAppearance(): Appearance {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'contrast' || stored === 'dark') return stored
  return 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(readStoredAppearance)

  useEffect(() => {
    document.documentElement.setAttribute('data-appearance', appearance)
    localStorage.setItem(STORAGE_KEY, appearance)
  }, [appearance])

  const setAppearance = useCallback((mode: Appearance) => {
    setAppearanceState(mode)
  }, [])

  const value = useMemo(() => ({ appearance, setAppearance }), [appearance, setAppearance])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
