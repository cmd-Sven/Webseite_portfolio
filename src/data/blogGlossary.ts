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
  'UX/UI': {
    term: 'UX/UI',
    description:
      'User Experience + User Interface: Wie es sich anfühlt und wie es aussieht. Beides muss zusammenspielen – sonst klicken Leute woanders.',
  },
  UI: {
    term: 'UI',
    description:
      'User Interface – Buttons, Layout, Typo. Die sichtbare Schicht. Ohne gute UX bleibt sie Deko.',
  },
  Frontend: {
    term: 'Frontend',
    description:
      'Alles, was im Browser läuft: UI, Interaktion, Performance. Hier entscheidet sich, ob Technik für Nutzer spürbar wird.',
  },
  'Full-Stack': {
    term: 'Full-Stack',
    description:
      'Frontend und Backend zusammengedacht – von der UI bis zur API/DB. Praktisch, wenn Features Ende-zu-Ende geliefert werden sollen.',
  },
  'Full-Stack-Entwicklung': {
    term: 'Full-Stack-Entwicklung',
    description:
      'Frontend und Backend zusammengedacht – von der UI bis zur API/DB. Praktisch, wenn Features Ende-zu-Ende geliefert werden sollen.',
  },
  Dashboard: {
    term: 'Dashboard',
    description:
      'Übersicht mit den wichtigsten Kennzahlen auf einen Blick. Gut, wenn es Entscheidungen beschleunigt – schlecht, wenn es nur bunte Charts stapelt.',
  },
  Dashboards: {
    term: 'Dashboards',
    description:
      'Mehrere Kennzahlen-Übersichten. Der Wert steckt in Klarheit und Navigation – nicht in der Chart-Anzahl.',
  },
  KPI: {
    term: 'KPI',
    description:
      'Key Performance Indicator – die Kennzahl, an der du Entscheidungen festmachst. Wenige, klare KPIs schlagen Dashboard-Wirrwarr.',
  },
  KPIs: {
    term: 'KPIs',
    description:
      'Key Performance Indicators – die wenigen Zahlen, die wirklich steuern. Mehr Metriken ≠ mehr Klarheit.',
  },
  'Funnel-Analyse': {
    term: 'Funnel-Analyse',
    description:
      'Schritt für Schritt im Trichter: wo springen Nutzer ab? Zeigt den Engpass – nicht nur, dass „irgendwas“ fehlt.',
  },
  'Funnel-Analysen': {
    term: 'Funnel-Analysen',
    description:
      'Schritt für Schritt im Trichter: wo springen Nutzer ab? Zeigt den Engpass – nicht nur, dass „irgendwas“ fehlt.',
  },
  Funnel: {
    term: 'Funnel',
    description:
      'Der Trichter: wo Nutzer von Schritt zu Schritt abspringen. Zeigt, wo es wirklich knirscht.',
  },
  'Conversion-Optimierung': {
    term: 'Conversion-Optimierung',
    description:
      'Messbar mehr Besucher zum Ziel bringen. Eng verwandt mit CRO – Hypothese, Test, Lernen statt Bauchgefühl.',
  },
  'Conversion-Rate': {
    term: 'Conversion-Rate',
    description:
      'Anteil der Besucher, die die gewünschte Aktion machen. Formel: Conversions ÷ Besucher.',
  },
  'A/B-Testing': {
    term: 'A/B-Testing',
    description:
      'Varianten gegeneinander messen statt zu diskutieren. Ohne Sample Size und Stopp-Kriterien gewinnt oft nur der Zufall.',
  },
  'A/B-Tests': {
    term: 'A/B-Tests',
    description:
      'Mehrere Varianten-Vergleiche. Jeder Test braucht eine klare Hypothese – sonst sammelst du nur Rauschen.',
  },
  'Business Intelligence': {
    term: 'Business Intelligence',
    description:
      'Daten so aufbereiten, dass Entscheider handeln können. Reports allein reichen nicht – die Story und die nächste Frage zählen.',
  },
  'User Journeys': {
    term: 'User Journeys',
    description:
      'Der Weg durch Produkt oder Seite aus Nutzersicht. Genau dort siehst du, wo Reibung entsteht – nicht im Wireframe allein.',
  },
  WCAG: {
    term: 'WCAG',
    description:
      'Web Content Accessibility Guidelines – der Standard für barrierefreie Web-Inhalte. Kontrast, Tastatur, Screenreader inklusive.',
  },
  DSGVO: {
    term: 'DSGVO',
    description:
      'Datenschutz-Grundverordnung: Regeln für personenbezogene Daten in der EU. Kundendaten nicht unüberlegt in öffentliche LLMs kippen.',
  },
  LLM: {
    term: 'LLM',
    description:
      'Large Language Model – die KI hinter ChatGPT, Claude & Co. Schnell bei Code und Text, aber ohne dein Urteil und ohne echte Verantwortung.',
  },
  SPAs: {
    term: 'SPAs',
    description:
      'Single Page Applications: eine geladene App, Navigation ohne klassischen Seitenreload. Host für Features und Islands.',
  },
  'Core Web Vitals': {
    term: 'Core Web Vitals',
    description:
      'Googles Performance-Kennzahlen (LCP, INP, CLS). Langsam oder wackelig? Dann leidet UX – und oft auch die Conversion.',
  },
  Lighthouse: {
    term: 'Lighthouse',
    description:
      'Audit-Tool von Chrome: Performance, Accessibility, Best Practices, SEO. Gut als Checkliste – kein Ersatz für echte Nutzer.',
  },
  'Bounce-Rate': {
    term: 'Bounce-Rate',
    description:
      'Englisch für Absprungrate: Anteil der Leute, die nach einer Seite wieder weg sind. Hoch heißt oft: Erwartung und Inhalt passen nicht.',
  },
  'UX-Lift': {
    term: 'UX-Lift',
    description:
      'Geschätzte CR-Verbesserung durch UX-Änderungen. Kein Marketingversprechen – eine Annäherung aus Benchmarks und Hypothesen.',
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
  CTA: {
    term: 'CTA',
    description:
      'Call-to-Action – der Button oder Link, der die gewünschte Aktion auslöst. Unsichtbar oder unklar? Dann war der Rest der Seite umsonst.',
  },
  CR: {
    term: 'CR',
    description:
      'Conversion-Rate: Anteil der Besucher, die die gewünschte Aktion machen. Formel: Conversions ÷ Besucher.',
  },
  Uplift: {
    term: 'Uplift',
    description:
      'Relative Verbesserung gegenüber dem Ausgangswert. +10 % Uplift bei 5 % CR heißt: du bist bei 5,5 %.',
  },
  'p-Wert': {
    term: 'p-Wert',
    description:
      'Wahrscheinlichkeit, einen so starken (oder stärkeren) Unterschied zu sehen, wenn in Wahrheit keiner da wäre. Oft gilt p < 0,05 als Schwelle.',
  },
  p: {
    term: 'p',
    description:
      'Kurz für p-Wert: Wie wahrscheinlich ist dieses Ergebnis unter der Annahme „kein echter Unterschied“? Klein = eher kein Zufall.',
  },
  Salienz: {
    term: 'Salienz',
    description:
      'Wie stark etwas aus der Umgebung „heraussticht“ und Aufmerksamkeit bindet. Ein CTA mit hoher Salienz wird eher gesehen und geklickt.',
  },
  Semantik: {
    term: 'Semantik',
    description:
      'Farbsemantik: Was Farben kulturell bedeuten – Grün oft „Go“ und Erfolg. Der CTA signalisiert damit eher „weitermachen“ als neutrales Blau.',
  },
  Farbsemantik: {
    term: 'Farbsemantik',
    description:
      'Was Farben kulturell bedeuten – Grün oft „Go“ und Erfolg. Der CTA signalisiert damit eher „weitermachen“ als neutrales Blau.',
  },
  'Von-Restorff-Effekt': {
    term: 'Von-Restorff-Effekt',
    description:
      'Auch Isolation Effect: Was sich vom Muster abhebt, bleibt im Gedächtnis und zieht den Blick. Ein akzentuierter CTA gegen typisches Blau-UI macht genau das.',
  },
  'Isolation Effect': {
    term: 'Isolation Effect',
    description:
      'Dasselbe wie der Von-Restorff-Effekt: Abweichung vom Umfeld = mehr Aufmerksamkeit. Deshalb wirkt ein grüner Hero-CTA oft salienzstärker als „noch ein Blau-Button“.',
  },
  'Aesthetic-Usability Effect': {
    term: 'Aesthetic-Usability Effect',
    description:
      'Was vertraut und „richtig“ wirkt, fühlt sich bedienbarer an – und senkt Unsicherheit vor dem Klick. Das „Go“-Grün spielt genau diese Heuristik.',
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
  Bundle: {
    term: 'Bundle',
    description:
      'Das ausgelieferte JavaScript-Paket. Mehr KB = mehr Download, Parse und Main-Thread-Last – spürbar auf Mittelklasse-Handys.',
  },
  WebP: {
    term: 'WebP',
    description:
      'Modernes Bildformat mit starker Kompression. Unkomprimierte PNGs/JPEGs fressen Bandbreite – WebP/AVIF entlasten LCP.',
  },
  'Doherty Threshold': {
    term: 'Doherty Threshold',
    description:
      'UX-Faustregel: Unter ~400 ms fühlt sich eine Reaktion „instant“ an. Darüber merkt man Wartezeit – und Geduld schwindet.',
  },
  TTFB: {
    term: 'TTFB',
    description:
      'Time to First Byte: wie lange der Server braucht, bevor überhaupt etwas ankommt. Hohe Latenz zieht alles nach hinten.',
  },
}

export type BlogGlossaryKey = keyof typeof BLOG_GLOSSARY

export function getBlogGlossaryEntry(key: string): BlogGlossaryEntry | undefined {
  return BLOG_GLOSSARY[key]
}
