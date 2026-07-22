import type { CaseStudy } from '../types/portfolio'

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'optimize_cro',
    badge: 'UX & DATA SCIENCE',
    badgeColor: 'from-cyan-500 to-teal-400',
    title: 'OPTIMIZE_CRO',
    subtitle: 'A/B Testing & E-Commerce Redesign',
    teaser:
      'Analyse von Nutzerabbrüchen im Checkout-Funnel. Durch gezieltes Redesign und statistische Hypothesentests wurde die Conversion Rate simuliert optimiert.',
    tags: ['Data Analytics', 'React', 'Python / SciPy', 'A/B Testing'],
    situation:
      'Ein mittelständischer E-Commerce-Händler verzeichnete eine ungewöhnlich hohe Abbruchrate von 42% im letzten Schritt des Bestellprozesses (Checkout). Die genauen Usability-Gründe waren unklar.',
    task: 'Es galt, den Datensatz zu analysieren, quantitative Schwachstellen zu identifizieren, das UI nach UX-Gesetzen umzugestalten und die Verbesserung mathematisch abzusichern.',
    action:
      "Zuerst habe ich mittels Python (Pandas) einen synthetischen Datensatz von 10.000 Sessions analysiert, um die Drop-Off-Points zu isolieren. Auf dieser Basis wurde das Formularlayout in Figma nach Hick's Law gestrafft (weniger kognitive Last) und in React neu gebaut. Abschließend habe ich einen simulierten A/B-Test durchgeführt und mittels Chi-Quadrat-Test (SciPy) auf Signifikanz geprüft.",
    result:
      'Die optimierte Variante senkte die Abbruchrate im mathematischen Modell signifikant. Umgerechnet auf den realen Traffic entspricht dies einer Steigerung der Conversion Rate um +24% und einer erheblichen Umsatzsteigerung.',
    githubUrl: 'https://github.com/svensieber',
    mockupImg: '/projects/optimize_cro/cover.webp',
  },
  {
    id: 'finance_dashboard',
    badge: 'FRONTEND & API',
    badgeColor: 'from-violet-500 to-fuchsia-400',
    title: 'FINANCE_DASHBOARD',
    subtitle: 'Echtzeit Finanz-Cockpit',
    teaser:
      'Entwicklung einer hoch-performanten Dashboard-Webapp zur Visualisierung komplexer Wertpapierdaten mit Vue 3 und TypeScript.',
    tags: ['Vue 3', 'TypeScript', 'Tailwind CSS', 'REST-APIs'],
    situation:
      'Klassische Finanz-Dashboards leiden oft unter massiven Performance-Einbrüchen, wenn große Mengen an historischen Zeitreihendaten gleichzeitig im Client gerendert werden.',
    task: 'Ziel war die Entwicklung einer reaktiven Single-Page-Applikation, die Finanzdaten über eine offene API aggregiert und ohne spürbare Ladezeiten (60 FPS) via SVG/Canvas visualisiert.',
    action:
      'Implementierung einer modularen Architektur in Vue 3 (Composition API) und TypeScript. Die Datenströme wurden clientseitig normalisiert, um unnötige Re-Renderings zu vermeiden. Das UI wurde mit Tailwind CSS im Dark-Mode gestaltet, um die visuelle Hierarchie der KPIs zu schärfen.',
    result:
      'Ein voll funktionales, responsives Cockpit, das auch bei der Verarbeitung von über 50.000 Datenpunkten flüssig reagiert. Der Prototyp demonstriert exzellente Core Web Vitals (LCP < 1.2s).',
    githubUrl: 'https://github.com/svensieber',
    mockupImg: '/projects/finance_dashboard/cover.webp',
  },
  {
    id: 'medtech_identity',
    badge: 'BRANDING & A11Y',
    badgeColor: 'from-emerald-500 to-green-400',
    title: 'MEDTECH_IDENTITY',
    subtitle: 'Medizinische Web-Präsenz',
    teaser:
      'Komplettes UI/UX Design, Corporate Branding und barrierefreie Frontend-Entwicklung (WCAG AA konform) für ein Medizintechnik-Szenario.',
    tags: ['UI/UX', 'Figma', 'Accessibility (A11y)', 'Corporate Design'],
    situation:
      'Im medizinischen Sektor ist digitale Barrierefreiheit oft unzureichend, obwohl ältere oder eingeschränkte Menschen zur primären Zielgruppe gehören.',
    task: 'Entwicklung eines ganzheitlichen Corporate Designs und einer Web-Präsenz, die strengen WCAG 2.1 AA Richtlinien entspricht, ohne dabei an moderner Ästhetik einzubüßen.',
    action:
      'Erstellung eines barrierefreien Farbsystems (Kontrastverhältnis > 4.5:1) und responsiver Typografie-Skalen in Figma. Bei der Frontend-Entwicklung wurden semantisches HTML, WAI-ARIA-Attribute und eine vollständige Tastatur-Navigierbarkeit sichergestellt.',
    result:
      'Ein absolut sauberes, empathisches Design-System. Der anschließende Audit mit Lighthouse und Screenreadern (NVDA) ergab einen Accessibility-Score von perfekten 100/100 Punkten.',
    figmaUrl: 'https://figma.com',
    mockupImg: '/projects/medtech_identity/cover.webp',
  },
]

export function getProjectGlowClass(projectId: string): string {
  if (projectId === 'optimize_cro') return 'card-glow--cyan-teal'
  if (projectId === 'finance_dashboard') return 'card-glow--violet-fuchsia'
  return 'card-glow--emerald-cyan'
}

export function getProjectHeaderGradient(projectId: string): string {
  if (projectId === 'optimize_cro') return 'from-cyan-950/80'
  if (projectId === 'finance_dashboard') return 'from-violet-950/80'
  return 'from-emerald-950/80'
}
