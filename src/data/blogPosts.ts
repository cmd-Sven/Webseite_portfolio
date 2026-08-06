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
      'Deine Haupt-App läuft in React, aber für einen Rechner oder Konfigurator will ein Team Vue nutzen? Mit Vue-Islands geht das – ohne die ganze App neu zu schreiben.',
    content: `Deine Haupt-App läuft in React, aber für einen bestimmten Rechner oder Konfigurator will ein Team unbedingt Vue nutzen? Kein Grund, die ganze App neu zu schreiben.

Für solche isolierten Bausteine reicht oft eine Vue-Island. Das ist ein kleines Vue-Modul, das sich unauffällig in deine React-Umgebung einklinkt – wie ein maßgefertigtes Regal, das perfekt in eine bestehende Wand passt.

## Die drei goldenen Regeln der Zusammenarbeit

Damit sich React und Vue nicht in die Quere kommen, brauchst du klare Absprachen:

**Daten rein (Props):** Welche Infos bekommt Vue von React? (z. B. den aktuellen User-Status).

**Signale raus (Events):** Wie sagt Vue Bescheid, wenn der Nutzer fertig ist? (z. B. „Der Rechner ist durch, aktualisiere den Warenkorb!“).

**Der Chef bleibt React:** Die Haupt-App behält die Kontrolle. Vue kümmert sich nur isoliert um sein eigenes kleines Revier.

## Lohnt sich das?

**Das Gute:** Spezialisierte Teams können in ihrem gewohnten Stack arbeiten, während der Nutzer am Ende eine völlig nahtlose App erlebt.

**Das Schlechte:** Du holst dir zwei Build-Pipelines ins Projekt und musst aktiv aufpassen, dass Design-Elemente (wie Buttons oder Fonts) nicht plötzlich unterschiedlich aussehen.

**Fazit:** Vue-Islands in einer React-App sind kein Freifahrtschein für ein wildes Framework-Chaos, sondern ein cleverer, pragmatischer Werkzeug-Griff, wenn du gezielt Features integrieren willst, ohne das Rad neu zu erfinden.`,
    tags: ['React', 'Vue', 'Architektur'],
    readMinutes: 5,
  },
  {
    id: 'svg-dashboards',
    title: 'SVG-Dashboards ohne Chart-Library: Performance und Barrierefreiheit',
    date: '2026-03-02',
    coverImage: '/blog/svg-dashboards.webp',
    teaser:
      'Willst du nur eine Abkürzung über den Teich nehmen, charterst du sicherlich kein riesiges Frachtschiff – genau so verhält es sich oft mit großen Chart-Libraries in Dashboards.',
    content: `Willst du nur eine Abkürzung über den Teich nehmen, charterst du sicherlich kein riesiges Frachtschiff. Genau so verhält es sich oft mit großen Chart-Libraries in Dashboards.

Schwere Bibliotheken sind fantastisch, wenn Nutzer Daten interaktiv erforschen wollen (zoomen, filtern, klicken). Aber für ein festes Reporting-Dashboard sind sie oft schlichtweg Overkill – sie blähen das Projekt unnötig auf und bremsen die Performance aus.

## Warum rohe SVGs oft die bessere Wahl sind

Mit ein paar gezielten SVG-Pfaden und Text-Labels baust du maßgeschneiderte Charts, die sehr performant sind. Der riesige Bonus: Du hast die volle Kontrolle über den Code und kannst Barrierefreiheit (Accessibility) von Anfang an sauber einbauen (z. B. mit echten ARIA-Rollen für Screenreader).

## Wie man es schlank und flüssig hält

Damit das Dashboard auch auf älteren Geräten butterweich läuft, helfen ein paar einfache Regeln:

**Einmal rechnen statt dauernd schwitzen:** Wir normalisieren die Rohdaten einmal im Client, statt bei jeder kleinsten Bewegung im Browser unnötig Rechenleistung zu verbrennen.

**Smart cachen:** Pfade, die sich nicht verändern, werden im Speicher behalten. Der Browser rendert nur das, was wirklich neu ist.

**Farben aus dem Baukasten (Tokens):** Keine harten Farbwerte im Code, sondern Design-Tokens. So springt das Dashboard sauber zwischen Light-Mode, Dark-Mode und Kontrastmodus hin und her, ohne dass etwas kaputtgeht.

## Das Ergebnis

Ein Dashboard, das auch auf schwächeren Geräten flüssig bleibt, barrierefrei funktioniert und sich am Ende anfühlt wie ein echtes, fertiges Produkt – und nicht wie eine überladene Technik-Spielerei.`,
    tags: ['SVG', 'Performance', 'Accessibility'],
    readMinutes: 5,
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
