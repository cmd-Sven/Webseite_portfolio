import type { BlogPost } from '../types/blog'

export const BLOG_COVER_PLACEHOLDER = '/blog/placeholder.svg'

/**
 * Blogbeiträge hier pflegen – neueste zuerst.
 * teaser: Kurztext in der Übersicht; content: Volltext (Absätze mit Leerzeile).
 * coverImage: optional, sonst Platzhalter
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'cro-hypothesen',
    title: 'Von der Hypothese zum A/B-Test: CRO ohne Bauchgefühl',
    date: '2026-05-28',
    coverImage: '/blog/cro-hypothesen.webp',
    teaser:
      'Wie ich Checkout-Drop-offs mit Funnel-Daten isoliere, UX-Hypothesen formuliere und Signifikanz vor dem Rollout prüfe.',
    content: `Conversion-Optimierung beginnt selten mit einem neuen Button-Farbton. In der Praxis starte ich mit einer sauberen Event-Struktur: Wo brechen Nutzer ab, welche Segmente verhalten sich anders, und welche Metrik ist für das Business wirklich relevant?

Aus den Daten leite ich testbare Hypothesen ab – nicht „wir brauchen ein Redesign“, sondern „Weniger Felder im letzten Schritt reduziert die kognitive Last und senkt die Abbruchrate um X Prozent“. Das UI folgt erst danach.

Ein simulierter oder echter A/B-Test braucht klare Stopp-Kriterien. Chi-Quadrat oder Bayes – je nach Sample Size – verhindert, dass wir auf Rauschen optimieren. Genau diese Disziplin übertrage ich von der Spezialisierung Datenanalyse in meine Frontend-Arbeit.`,
    tags: ['CRO', 'Datenanalyse', 'UX'],
    readMinutes: 5,
  },
  {
    id: 'react-vue-bridge',
    title: 'React + Vue in einer SPA: Wann sich Micro-Frontends lohnen',
    date: '2026-04-12',
    coverImage: '/blog/react-vue-bridge.webp',
    teaser:
      'Ein pragmatischer Blick auf Vue-Web-Components in React – ohne Overhead, aber mit klaren Integrationsgrenzen.',
    content: `Nicht jedes Team braucht ein separates Vue-Bundle. Für isolierte Widgets – Rechner, Konfiguratoren, Legacy-Module – reicht oft eine Vue-3-Island, die über Custom Elements oder einen kleinen Mount-Point in React läuft.

Wichtig sind Verträge: Welche Props gehen rein, welche Events gehen raus, und wer besitzt den globalen State? Ich halte die Shell in React, Vue bleibt feature-kapselt.

Der Vorteil: Spezialisierte Teams können in ihrem Stack bleiben, das Portfolio bleibt eine kohärente Experience. Der Nachteil: Zwei Build-Pipelines und doppelte Design-Tokens, wenn man sie nicht aktiv synchronisiert.`,
    tags: ['React', 'Vue', 'Architektur'],
    readMinutes: 4,
  },
  {
    id: 'svg-dashboards',
    title: 'SVG-Dashboards ohne Chart-Library: Performance und Barrierefreiheit',
    date: '2026-03-02',
    coverImage: '/blog/svg-dashboards.webp',
    teaser:
      'Warum ich für KPI-Übersichten oft auf handgebautes SVG setze – und wie das LCP und die Wartbarkeit beeinflusst.',
    content: `Schwere Chart-Libraries sind großartig für Exploration, aber für feste Reporting-Views oft Overkill. Ein SVG mit wenigen Pfaden und Text-Labels lässt sich gezielt animieren, ist skalierbar und lässt ARIA-Rollen sauber setzen.

Ich normalisiere Daten einmal im Client, rendere nur die sichtbare Viewport-Range und vermeide unnötige Re-Renders durch memoized Paths. Farben kommen aus Tokens, nicht aus Hardcodes – damit Light, Dark und Kontrastmodus konsistent bleiben.

Das Ergebnis: ein Dashboard, das auch auf schwächeren Geräten flüssig bleibt und trotzdem wie ein Produkt wirkt, nicht wie ein Technik-Demo.`,
    tags: ['SVG', 'Performance', 'Accessibility'],
    readMinutes: 6,
  },
  {
    id: 'design-tokens',
    title: 'Design Tokens zwischen Figma und Tailwind 4',
    date: '2026-01-18',
    coverImage: '/blog/design-tokens.webp',
    teaser:
      'Wie ich visuelle Entscheidungen als Tokens exportiere und im Code nicht jedes Projekt neu erfinden muss.',
    content: `Tokens sind die Schnittstelle zwischen Design und Engineering. Ich definiere Farben, Abstände und Typo-Skalen einmal – in Figma als Variablen, im Code als CSS Custom Properties oder Tailwind-Theme-Erweiterungen.

Der Trick ist Disziplin beim Naming: semantic statt decorative („surface-elevated“ statt „gray-800“), damit Themes und Barrierefreiheitsmodi ohne Refactor möglich sind.

In diesem Portfolio steuern data-appearance und CSS-Variablen Light, Dark und Kontrast – die Cards bleiben dieselben Komponenten, nur die Token-Werte wechseln.`,
    tags: ['Design Systems', 'Tailwind', 'Figma'],
    readMinutes: 4,
  },
]

export function getSortedBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date))
}

export function getBlogCoverImage(post: BlogPost): string {
  return post.coverImage ?? BLOG_COVER_PLACEHOLDER
}

/** Gruppiert Beiträge für den Slider (z. B. 2 pro Slide). */
export function getBlogPostSlides(posts: BlogPost[], perSlide = 2): BlogPost[][] {
  const slides: BlogPost[][] = []
  for (let i = 0; i < posts.length; i += perSlide) {
    slides.push(posts.slice(i, i + perSlide))
  }
  return slides
}

export function getLatestBlogPosts(count: number): BlogPost[] {
  return getSortedBlogPosts().slice(0, count)
}

export function getNewestBlogPost(): BlogPost | undefined {
  return getLatestBlogPosts(1)[0]
}

export function formatBlogDate(isoDate: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate))
}
