import type { NavSection } from '../types/portfolio'

export const SECTIONS_ORDER = [
  'hero',
  'about',
  'expertise',
  'techstack',
  'dashboard',
  'projects',
  'blog',
  'contact',
] as const

/** Anker-IDs der Landingpage-Sektionen (Reihenfolge = Scroll-Reihenfolge) */
export const NAV_SECTIONS: NavSection[] = [
  { id: 'hero', title: 'Start', subtitle: 'Intro & Fokus' },
  { id: 'about', title: 'Über mich', subtitle: 'Profil & Werdegang' },
  { id: 'expertise', title: 'Expertise', subtitle: 'Vier Kernsäulen' },
  { id: 'techstack', title: 'Tech Stack', subtitle: 'Tools & Skills' },
  { id: 'dashboard', title: 'Analytics', subtitle: 'Live-Demo' },
  { id: 'projects', title: 'Projekte', subtitle: 'Case Studies' },
  { id: 'blog', title: 'Blog', subtitle: 'Artikel & Insights' },
  { id: 'contact', title: 'Kontakt', subtitle: 'Nachricht senden' },
]

/**
 * Landingpage-Lebenslauf: öffentliches Storage-Objekt (Admin-Upload spiegelt dorthin).
 * Fallback: lokales Vite-Static unter public/documents/.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '')

export const RESUME_PDF_PATH = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/portfolio-public/lebenslauf.pdf`
  : '/documents/lebenslauf.pdf'
