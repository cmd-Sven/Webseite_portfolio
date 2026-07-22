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

export const NAV_SECTIONS: NavSection[] = [
  { id: 'hero', title: 'Start', subtitle: 'Intro' },
  { id: 'about', title: 'Über mich', subtitle: 'Profil' },
  { id: 'expertise', title: 'Expertise', subtitle: '4 Säulen' },
  { id: 'techstack', title: 'Tech Stack', subtitle: 'Tools' },
  { id: 'dashboard', title: 'Analytics', subtitle: 'Live Demo' },
  { id: 'projects', title: 'Projekte', subtitle: 'Case Studies' },
  { id: 'blog', title: 'Blog', subtitle: 'Artikel' },
  { id: 'contact', title: 'Kontakt', subtitle: 'Bewerbung' },
]

export const RESUME_PDF_PATH = '/documents/lebenslauf.pdf'
