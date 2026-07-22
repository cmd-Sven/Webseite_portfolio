export interface BlogPost {
  id: string
  title: string
  /** ISO-Datum, z. B. 2026-03-15 */
  date: string
  teaser: string
  /** Volltext – Absätze mit Leerzeile getrennt */
  content: string
  /** Pfad unter /public, z. B. /blog/mein-artikel.webp */
  coverImage?: string
  tags?: string[]
  readMinutes?: number
}
