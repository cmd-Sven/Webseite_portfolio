/** Live-Site als Bookmarklet-Ziel (nicht localhost beim lokalen Entwickeln). */

export const BOOKMARKLET_PRODUCTION_ORIGIN = 'https://portfolio-sven-sieber.vercel.app'

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '')
}

export function isLocalDevOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host.endsWith('.local')
    )
  } catch {
    return /localhost|127\.0\.0\.1/i.test(origin)
  }
}

/** Konfigurierte bzw. hardcodierte Production-Origin für Bookmarklets. */
export function getConfiguredPublicSiteOrigin(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_SITE_URL ?? '').trim()
  if (!fromEnv) return BOOKMARKLET_PRODUCTION_ORIGIN
  try {
    return normalizeOrigin(new URL(fromEnv).origin)
  } catch {
    return normalizeOrigin(fromEnv)
  }
}

/**
 * Origin, die Bookmarklets öffnen sollen.
 * Localhost/127.0.0.1 → Production; sonst aktuelle Origin (Custom Domain).
 */
export function getBookmarkletSiteOrigin(
  currentOrigin: string =
    typeof window !== 'undefined'
      ? window.location.origin
      : BOOKMARKLET_PRODUCTION_ORIGIN,
): string {
  const production = getConfiguredPublicSiteOrigin()
  if (isLocalDevOrigin(currentOrigin)) return production
  return normalizeOrigin(currentOrigin)
}

/** true, wenn das Bookmarklet nicht die aktuelle Seite, sondern die Live-Site trifft. */
export function bookmarkletUsesLiveSite(
  currentOrigin: string =
    typeof window !== 'undefined' ? window.location.origin : '',
): boolean {
  if (!currentOrigin) return true
  return getBookmarkletSiteOrigin(currentOrigin) !== normalizeOrigin(currentOrigin)
}
