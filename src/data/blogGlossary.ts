export interface BlogGlossaryEntry {
  term: string
  description: string
}

/**
 * Fachbegriffe für Blog-Tooltips – Wording: direkt, praxisnah, kein Lexikon-Ton.
 * Markup im Content: {{term:CRO}}
 */
export const BLOG_GLOSSARY: Record<string, BlogGlossaryEntry> = {
  CRO: {
    term: 'CRO',
    description:
      'Conversion Rate Optimization – systematisch rausfinden, warum Leute abspringen, und messbar mehr davon zum Ziel bringen. Kein Button-Roulette.',
  },
  'UX-Design': {
    term: 'UX-Design',
    description:
      'User Experience Design: Wie sich Produkt und Seite für echte Menschen anfühlen. Wenn’s hakt, wandern sie ab – egal wie schön der Button aussieht.',
  },
  UX: {
    term: 'UX',
    description:
      'User Experience – das Gesamterlebnis. Nicht nur „sieht gut aus“, sondern: Kommt der Nutzer klar, ohne zu fluchen?',
  },
  SEO: {
    term: 'SEO',
    description:
      'Search Engine Optimization: Sichtbarkeit bei Google ist nett – aber nur, wenn der Traffic auch das findet, was er gesucht hat.',
  },
  Datenanalyse: {
    term: 'Datenanalyse',
    description:
      'Zahlen nicht nur anstarren, sondern Geschichten dahinter lesen: Warum brechen Nutzer ab? Welche Segmente ticken anders?',
  },
  'Search Intent': {
    term: 'Search Intent',
    description:
      'Die echte Absicht hinter der Suchanfrage. Will jemand vergleichen, kaufen oder nur verstehen? Wer das verfehlt, verliert den Traffic sofort wieder.',
  },
  'Meta-Title': {
    term: 'Meta-Title',
    description:
      'Der Titel, den Google in den Suchergebnissen zeigt. Wichtig für Klicks – aber er rettet keine Seite, die den Intent nicht erfüllt.',
  },
  Conversion: {
    term: 'Conversion',
    description:
      'Die gewünschte Aktion: Kauf, Anmeldung, Lead. Alles, was aus einem Besuch einen Erfolg macht.',
  },
  Analytics: {
    term: 'Analytics',
    description:
      'Mess-Tools wie Google Analytics. Sitzungen und Absprungraten sind Rohmaterial – erst die Interpretation macht daraus Entscheidungen.',
  },
  Absprungrate: {
    term: 'Absprungrate',
    description:
      'Anteil der Leute, die nach einer Seite wieder weg sind. Hoch heißt: Erwartung und Inhalt passen nicht – oder der CTA ist unsichtbar.',
  },
  'Call-to-Action': {
    term: 'Call-to-Action',
    description:
      'Der klare nächste Schritt: „Jetzt kaufen“, „Demo buchen“. Wenn ihn niemand findet, war der Rest der Seite umsonst.',
  },
  Personas: {
    term: 'Personas',
    description:
      'Konkrete Nutzerbilder statt anonymer Traffic: Motivationen, Frustrationen, typische Situationen. Damit du nicht für „irgendwen“ baust.',
  },
  'Customer Journey': {
    term: 'Customer Journey',
    description:
      'Der ganze Weg: von Google über die Landingpage bis Checkout oder Abbruch. Genau dort siehst du, wo es wirklich knirscht.',
  },
  'Customer Journeys': {
    term: 'Customer Journeys',
    description:
      'Mehrere Wege durchs Produkt – nicht jeder Nutzer läuft denselben Pfad. Wer nur den Happy Path kennt, optimiert blind.',
  },
  'Use Cases': {
    term: 'Use Cases',
    description:
      'Konkrete Nutzungssituationen: unterwegs, gestresst, vergleichend. Daraus folgt, was die Seite in dem Moment leisten muss.',
  },
  'UX-Research': {
    term: 'UX-Research',
    description:
      'Die Toolbox, um Nutzer wirklich zu verstehen: Interviews, Tests, Journey-Maps. Bauchgefühl ersetzt das nicht.',
  },
  Hypothese: {
    term: 'Hypothese',
    description:
      'Eine testbare Annahme – nicht „wir brauchen ein Redesign“, sondern: Wenn wir X ändern, sollte Y messbar besser werden.',
  },
  Hypothesen: {
    term: 'Hypothesen',
    description:
      'Testbare Annahmen aus UX, SEO und Daten. Ohne sie ist jeder A/B-Test nur teures Raten.',
  },
  'A/B-Test': {
    term: 'A/B-Test',
    description:
      'Zwei Varianten gegeneinander laufen lassen und messen, was wirklich zieht. Ohne Stopp-Kriterien gewinnt oft nur der Zufall.',
  },
  'Chi-Quadrat': {
    term: 'Chi-Quadrat',
    description:
      'Klassischer Signifikanz-Check: Ist der Unterschied zwischen A und B echt – oder könnte er auch Zufall sein?',
  },
  'Chi-Quadrat-Test': {
    term: 'Chi-Quadrat-Test',
    description:
      'Statistik-Check für A/B-Ergebnisse: Hilft zu entscheiden, ob der Lift echt ist oder nur Rauschen.',
  },
  'bayesianische Statistik': {
    term: 'bayesianische Statistik',
    description:
      'Wahrscheinlichkeiten statt starrer Ja/Nein-Schwellen. Praktisch, wenn die Sample Size klein ist und du laufend einschätzen willst, wer führt.',
  },
  'Sample Size': {
    term: 'Sample Size',
    description:
      'Wie viele Nutzer im Test stecken. Zu wenig Daten? Dann feierst du Rauschen als Erfolg – und launchest Blindgänger.',
  },
  Checkout: {
    term: 'Checkout',
    description:
      'Der Bezahl- bzw. Abschlussprozess. Hier sterben viele Conversions – oft an überflüssigen Feldern und kognitiver Überlastung.',
  },

  // —— Design Tokens ——
  'Design Tokens': {
    term: 'Design Tokens',
    description:
      'Zentrale Design-Werte (Farbe, Abstand, Typo) mit Namen statt Hardcodes. Ein Schalter – und die ganze App zieht mit.',
  },
  'Figma-Variablen': {
    term: 'Figma-Variablen',
    description:
      'Tokens direkt im Design-Tool. Gleicher Name wie im Code – dann reden Designer und Dev endlich über dieselbe Sache.',
  },
  'CSS Custom Properties': {
    term: 'CSS Custom Properties',
    description:
      'CSS-Variablen wie --color-surface. Laufzeit änderbar – ideal für Themes, ohne Komponenten umzuschreiben.',
  },
  Tailwind: {
    term: 'Tailwind',
    description:
      'Utility-CSS-Framework. Tokens landen dort als Theme-Erweiterung – dann heißt’s bg-surface statt bg-[#1a1a1a].',
  },
  'Decorative Tokens': {
    term: 'Decorative Tokens',
    description:
      'Nach Aussehen benannt (gray-800). Sieht klar aus – bis Dark Mode kommt und du an 200 Stellen nachbessern darfst.',
  },
  'Semantic Tokens': {
    term: 'Semantic Tokens',
    description:
      'Nach Zweck benannt (surface-elevated). Der Name bleibt, der Wert wechselt – Themes werden damit machbar.',
  },
  'Dark Mode': {
    term: 'Dark Mode',
    description:
      'Dunkles Theme. Mit Tokens kein Rewrite, sondern andere Werte hinter denselben Namen.',
  },
  'Dark-Mode': {
    term: 'Dark-Mode',
    description:
      'Dunkles Theme. Mit Tokens kein Rewrite, sondern andere Werte hinter denselben Namen.',
  },
  Kontrastmodus: {
    term: 'Kontrastmodus',
    description:
      'Hochkontrast-Theme für bessere Lesbarkeit. Dieselben Komponenten, andere Token-Werte – Barrierefreiheit ohne Fork.',
  },
  'data-appearance': {
    term: 'data-appearance',
    description:
      'HTML-Attribut am Root, das Light, Dark oder Kontrast umschaltet. Ein Schalter steuert alle Token-Werte darunter.',
  },
  Themes: {
    term: 'Themes',
    description:
      'Visuelle Varianten derselben UI. Mit Tokens wechselst du das Look-and-Feel, ohne Komponenten zu duplizieren.',
  },
  Barrierefreiheit: {
    term: 'Barrierefreiheit',
    description:
      'Damit die UI auch mit Screenreader, Tastatur und Kontrastbedarf funktioniert – nicht erst „wenn Zeit übrig ist“.',
  },

  // —— React + Vue / Micro-Frontends ——
  React: {
    term: 'React',
    description:
      'UI-Bibliothek von Meta. Komponentenbasiert, großer Ökosystem-Vorteil – hier oft die Host-App.',
  },
  Vue: {
    term: 'Vue',
    description:
      'Progressives Frontend-Framework. Viele Teams lieben den DX – deshalb lohnt sich manchmal eine Insel in der React-App.',
  },
  'Vue-Island': {
    term: 'Vue-Island',
    description:
      'Kleines Vue-Modul in einer fremden Host-App. Eigenes Revier, klare Props rein / Events raus – kein Framework-Mix überall.',
  },
  'Vue-Islands': {
    term: 'Vue-Islands',
    description:
      'Mehrere isolierte Vue-Bausteine in einer Host-App. Pragmatisches Micro-Frontend – kein volles Framework-Chaos.',
  },
  'Micro-Frontends': {
    term: 'Micro-Frontends',
    description:
      'UI in unabhängige Teile zerlegen, die Teams getrennt bauen können. Mächtig – aber Overhead, den du nur bei echtem Bedarf willst.',
  },
  SPA: {
    term: 'SPA',
    description:
      'Single Page Application: eine geladene App, Navigation ohne klassische Seitenreload. Host für Islands und Features.',
  },
  Props: {
    term: 'Props',
    description:
      'Daten, die von außen reinfließen. Bei Islands: React gibt den Status, Vue rendert damit – eine Richtung, klarer Vertrag.',
  },
  Events: {
    term: 'Events',
    description:
      'Signale nach draußen: „fertig“, „Wert geändert“. Die Island meldet, die Host-App entscheidet, was passiert.',
  },
  'Build-Pipeline': {
    term: 'Build-Pipeline',
    description:
      'Der Weg von Quellcode zu auslieferbarem Bundle. Zwei Frameworks = oft zwei Pipelines – und doppelte Pflege.',
  },
  'Build-Pipelines': {
    term: 'Build-Pipelines',
    description:
      'Mehrere Build-Strecken parallel. React und Vue getrennt bundlen heißt: mehr Config, mehr Versionschaos-Risiko.',
  },
  Framework: {
    term: 'Framework',
    description:
      'Das Grundgerüst deiner UI (React, Vue, …). Zwei davon in einer App geht – aber nur mit klaren Grenzen.',
  },

  // —— SVG-Dashboards ——
  'Chart-Library': {
    term: 'Chart-Library',
    description:
      'Fertige Chart-Pakete mit Zoom, Filter, Klicks. Super für Exploration – fürs fixe Reporting oft zu schwer.',
  },
  'Chart-Libraries': {
    term: 'Chart-Libraries',
    description:
      'Schwere Chart-Frameworks. Interaktiv top, aber Bundle-Gewicht und Abstraktion, die du bei einfachen Reports selten brauchst.',
  },
  SVG: {
    term: 'SVG',
    description:
      'Scalable Vector Graphics: Vektorgrafik direkt im DOM. Leicht, pixelscharf, und du kontrollierst jeden Pfad selbst.',
  },
  SVGs: {
    term: 'SVGs',
    description:
      'Mehrere SVG-Grafiken. Für Dashboards: Charts als Pfade + Text, ohne die ganze Chart-Library mitzuschleppen.',
  },
  Accessibility: {
    term: 'Accessibility',
    description:
      'Barrierefreiheit auf Englisch: Screenreader, Tastatur, Kontrast. Bei Custom-SVGs musst du das bewusst einbauen.',
  },
  ARIA: {
    term: 'ARIA',
    description:
      'Rollen und Labels für assistive Technik. Damit ein Chart nicht nur „hübsche Grafik“ ist, sondern für Screenreader Sinn ergibt.',
  },
  Caching: {
    term: 'Caching',
    description:
      'Berechnetes zwischenspeichern statt neu rechnen. Unveränderte SVG-Pfade bleiben liegen – der Browser zeichnet nur Diffs.',
  },
  'Light-Mode': {
    term: 'Light-Mode',
    description:
      'Helles Theme. Zusammen mit Dark und Kontrast über Tokens umschaltbar – ohne Farb-Hardcodes im Chart-Code.',
  },

  // —— Tableau vs Custom ——
  Experience: {
    term: 'Experience',
    description:
      'Das Nutzererlebnis rund um die Daten: Greifbar, intuitiv, markenfit – nicht nur „die Zahlen stimmen“.',
  },
  'BI-Tools': {
    term: 'BI-Tools',
    description:
      'Business-Intelligence-Standardsoftware. Stark bei Analyse und Filtern – schwach, wenn du eine eigene Produkt-UI brauchst.',
  },
  'Build vs. Buy': {
    term: 'Build vs. Buy',
    description:
      'Selbst bauen oder fertig kaufen? Die Antwort hängt von Flexibilität, Marke und wie zentral das Dashboard im Produkt ist.',
  },
  Tableau: {
    term: 'Tableau',
    description:
      'Klassisches BI-Kraftwerk: Daten rein, Filter raus. Für Analysten top – für maßgeschneiderte Web-UX oft zu starr.',
  },
  Streamlit: {
    term: 'Streamlit',
    description:
      'Python-Framework für schnelle Daten-Apps. Mehr Layout-Freiheit als BI-Standard, ohne gleich ein ganzes Frontend-Team.',
  },
  'Frontend-Framework': {
    term: 'Frontend-Framework',
    description:
      'Das UI-Grundgerüst (React & Co.). Volle Kontrolle – und die Verantwortung für Routing, State und Performance dazu.',
  },
  MVP: {
    term: 'MVP',
    description:
      'Minimum Viable Product: Die kleinste Version, die echten Nutzen zeigt. Schnell lernen, ohne monatelang zu bauen.',
  },
  Usability: {
    term: 'Usability',
    description:
      'Ob Menschen das Ding wirklich bedienen können. Sieht gut aus reicht nicht – der Weg zur Insight muss klar sein.',
  },
  'Custom Web-App': {
    term: 'Custom Web-App',
    description:
      'Eigenbau im modernen Frontend-Stack. Maximale Pixel-Kontrolle – und du bist für alles selbst zuständig.',
  },
  'Design-Tokens': {
    term: 'Design-Tokens',
    description:
      'Zentrale Design-Werte mit Namen. Damit Dashboard und restliche App denselben Look teilen – Light, Dark, Marke inklusive.',
  },
  SaaS: {
    term: 'SaaS',
    description:
      'Software as a Service: Produkt im Abo für Endkunden. Hier zählt die Experience – Standard-BI bricht oft die Marke.',
  },
  'State-Management': {
    term: 'State-Management',
    description:
      'Wie App-Zustand fließt und bleibt. Im Eigenbau kein „kommt mit“ – du baust Filter, Auswahl und Sync selbst.',
  },
  'Micro-Interaction': {
    term: 'Micro-Interaction',
    description:
      'Kleine UI-Reaktionen: Hover, Feedback, sanfte Übergänge. Im Custom-Stack machbar – in BI-Tools meist Fehlanzeige.',
  },
}

export type BlogGlossaryKey = keyof typeof BLOG_GLOSSARY

export function getBlogGlossaryEntry(key: string): BlogGlossaryEntry | undefined {
  return BLOG_GLOSSARY[key]
}
