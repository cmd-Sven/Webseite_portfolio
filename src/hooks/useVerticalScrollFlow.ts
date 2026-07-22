import { useViewport } from '../context/ViewportContext'

/** Nur Mobile-Geräte-Vorschau (390px) → vertikal; sonst horizontal */
export function useVerticalScrollFlow(): boolean {
  const { viewport } = useViewport()
  return viewport === 'mobile'
}
