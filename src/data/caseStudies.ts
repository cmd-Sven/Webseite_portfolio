import type { CaseStudy } from '../types/portfolio'

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'goexplore',
    kind: 'case-study',
    badge: 'DATENANALYSE',
    badgeColor: 'from-cyan-500 to-teal-400',
    title: 'GOEXPLORE',
    subtitle: 'CEO-Dashboard für Wachstumsentscheidungen',
    teaser:
      'Ich habe Verkaufsdaten so aufbereitet, dass Expansion und Preis-Szenarien interaktiv vergleichbar werden – kein statischer Report, sondern ein Briefing-Cockpit.',
    tags: ['Data Analytics', 'TypeScript', 'KPI-Visualisierung', 'Szenario-Analyse'],
    goal:
      'Entscheidungsträger sollten Performance, Expansionsoptionen und What-if-Fragen in einem konsistenten Navigationsraum beantworten können – ohne Excel-Pingpong.',
    techniques:
      'Drei Analysebereiche gebaut: KPI-Karten mit Sparklines, Marktfilter und Ländervergleiche mit Drill-downs; dazu prognostische Views und kaufkraftgewichtete Preis-Szenarien. Fokus auf Scope-Konsistenz über Filter und Views hinweg.',
    transfer:
      'Das gleiche Muster nutze ich bei Business- und CEO-Dashboards: Metriken zuerst klären, dann explorierbar machen, Szenarien erst danach. Übertragbar auf BI-Frontends, Funnel-Reports und datengestützte Produktentscheidungen.',
    githubUrl: 'https://github.com/cmd-Sven/goexplore-dashboard',
    liveUrl: 'https://goexplore-app.vercel.app',
    mockupImg: '/projects/goexplore/cover.webp',
  },
  {
    id: 'tableheroes',
    kind: 'project',
    badge: 'LIVE-PROJEKT',
    badgeColor: 'from-emerald-500 to-green-400',
    title: 'TABLE HEROES',
    subtitle: 'TTRPG-Community & Kampagnen-Plattform',
    teaser:
      'Mein einziges laufendes Produkt: Community, Lore/Kampagnen und Session-Board unter table-heroes.de – produktiv betrieben, nicht nur als Demo.',
    tags: ['Next.js', 'Supabase', 'React', 'Three.js'],
    goal:
      'Gruppen und Spielleiter brauchen eine gemeinsame digitale Basis für Community, Weltbau und Sessions – ohne den Fokus auf analoges Spielen zu verlieren.',
    techniques:
      'Next.js/React mit Supabase (Auth, Postgres), Tailwind und Motion. Features u. a. Lore/NSCs, Session-Board, 3D-Würfel und KI-Chronist; Deploy und Cron auf Vercel. Ich iteriere am Live-System statt an einer einmaligen Showcase.',
    transfer:
      'Übertragbar auf Community- und SaaS-Produkte: Auth, Rollen, Feature-Releases unter realem Traffic. Das gleiche Muster – Shell in Next, Daten und Auth in Supabase, schrittweise Features – nutze ich bei größeren Full-Stack-Vorhaben.',
    githubUrl: 'https://github.com/cmd-Sven/tableheroes-website',
    liveUrl: 'https://table-heroes.de',
    mockupImg: '/projects/tableheroes/cover.webp',
  },
  {
    id: 'lernplattform',
    kind: 'case-study',
    badge: 'UX / UI',
    badgeColor: 'from-violet-500 to-fuchsia-400',
    title: 'PCEP LERNPLATTFORM',
    subtitle: 'Lernfluss, Onboarding & Feedback-Schleife',
    teaser:
      'Ich habe die PCEP-Vorbereitung um ein klares Onboarding und Übungsfluss herum gestaltet – und anhand von Teilnehmer-Feedback iteriert.',
    tags: ['UI/UX', 'Next.js', 'DaisyUI', 'Supabase'],
    goal:
      'Kurs-Teilnehmer sollten motiviert und geführt in Zertifizierungs-Inhalte einsteigen – nicht vor einer Inhaltsliste stehen bleiben.',
    techniques:
      'Hero-Onboarding mit Maskottchen Pyto, sequentielle Lektionen (Flip-Karten, Multiple Choice, Code), Theme-Varianten inkl. Kontrast, Challenges und ein Gästebuch als Feedback-Kanal. Stack: Next.js, DaisyUI, Supabase.',
    transfer:
      'Das gleiche Muster – bauen, mit echten Nutzern testen, Feedback einsammeln, nachschärfen – übertrage ich auf Onboarding-Flows, EdTech und jede UX, bei der Motivation und Klarheit vor Feature-Dichte kommen.',
    githubUrl: 'https://github.com/cmd-Sven/python-lernplattform',
    liveUrl: 'https://python-lernplattform.vercel.app',
    mockupImg: '/projects/lernplattform/cover.webp',
  },
  {
    id: 'bookworm',
    kind: 'case-study',
    badge: 'FULL-STACK',
    badgeColor: 'from-teal-500 to-cyan-400',
    title: 'BOOKWORM',
    subtitle: 'Bücherverleih unter Freunden',
    teaser:
      'Ich habe den Ausleihprozess digitalisiert: Katalog, Fristen, Auth – Next.js als Hauptapp, Streamlit als schneller Prototyp auf derselben Supabase-DB.',
    tags: ['Next.js', 'Supabase', 'Python / Streamlit', 'Auth & RLS'],
    goal:
      'Private Buchbestände und Ausleihen nachvollziehbar machen: Wer hat welches Buch, bis wann, und wie kommt es zurück?',
    techniques:
      'Next.js mit Supabase (Auth, Postgres, RLS), Google-Books-Anreicherung und ISBN-Barcode-Scan. Parallel eine Streamlit-Oberfläche für Katalog/Admin auf denselben Daten – Prototyp und Produktions-UI teilen das Schema.',
    transfer:
      'Übertragbar auf Full-Stack-Apps mit klaren Domänenregeln: Auth zuerst, RLS als Sicherheitsnetz, eine Datenbasis für mehrere UIs. Das gleiche Muster nutze ich, wenn ich schnell validieren und danach die React-Oberfläche ausbauen will.',
    githubUrl: 'https://github.com/cmd-Sven/bookworm-app',
    mockupImg: '/projects/bookworm/cover.webp',
  },
]

export function getProjectGlowClass(projectId: string): string {
  if (projectId === 'goexplore') return 'card-glow--cyan-teal'
  if (projectId === 'tableheroes') return 'card-glow--emerald-cyan'
  if (projectId === 'lernplattform') return 'card-glow--violet-fuchsia'
  return 'card-glow--violet-cyan'
}

export function getProjectHeaderGradient(projectId: string): string {
  if (projectId === 'goexplore') return 'from-cyan-950/80'
  if (projectId === 'tableheroes') return 'from-emerald-950/80'
  if (projectId === 'lernplattform') return 'from-violet-950/80'
  return 'from-teal-950/80'
}
