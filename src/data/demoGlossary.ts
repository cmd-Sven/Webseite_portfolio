export interface DemoGlossaryEntry {
  term: string
  description: string
}

/** Fachbegriffe für Demo-Legenden – Wording wie blogGlossary: direkt, praxisnah. */

export const ANALYTICS_DEMO_GLOSSARY: DemoGlossaryEntry[] = [
  {
    term: 'Traffic',
    description:
      'Wie viele Besucher reinkommen. Mehr Traffic heißt mehr Potenzial – aber ohne Conversion bleibt’s nur Lärm.',
  },
  {
    term: 'CR',
    description:
      'Conversion-Rate: Anteil der Besucher, die die gewünschte Aktion machen. Formel: Conversions ÷ Besucher.',
  },
  {
    term: 'Conversion-Rate',
    description:
      'Dasselbe wie CR – nur ausgeschrieben. Der zentrale Hebel, wenn du aus Traffic Ergebnis machen willst.',
  },
  {
    term: 'UX-Lift',
    description:
      'Geschätzte Verbesserung der CR durch UX-Änderungen. Kein Marketingversprechen – eine Annäherung aus Benchmarks und Hypothesen.',
  },
  {
    term: 'Funnel',
    description:
      'Der Trichter: wo Nutzer von Schritt zu Schritt abspringen. Zeigt, wo es wirklich knirscht – nicht nur, dass „irgendwas“ fehlt.',
  },
  {
    term: 'KPI',
    description:
      'Key Performance Indicator – die Kennzahl, an der du Entscheidungen festmachst. Wenige, klare KPIs schlagen Dashboard-Wirrwarr.',
  },
  {
    term: 'Uplift',
    description:
      'Relative Verbesserung gegenüber dem Ausgangswert. +10 % Uplift bei 5 % CR heißt: du bist bei 5,5 %.',
  },
]

export const AB_TEST_DEMO_GLOSSARY: DemoGlossaryEntry[] = [
  {
    term: 'CR',
    description:
      'Conversion-Rate je Variante. Ohne CR vergleichst du nur Bauchgefühl – und das lügt oft.',
  },
  {
    term: 'Uplift',
    description:
      'Wie viel besser (oder schlechter) der Challenger gegenüber Control abschneidet – relativ, nicht absolut.',
  },
  {
    term: 'Chi-Quadrat',
    description:
      'Klassischer Signifikanz-Check: Ist der Unterschied zwischen A und B echt – oder könnte er auch Zufall sein?',
  },
  {
    term: 'p',
    description:
      'p-Wert: Wahrscheinlichkeit, einen so starken (oder stärkeren) Unterschied zu sehen, wenn in Wahrheit keiner da wäre. Oft gilt p < 0,05 als Schwelle.',
  },
  {
    term: 'Salienz',
    description:
      'Wie stark etwas aus der Umgebung „heraussticht“ und Aufmerksamkeit bindet. Ein CTA mit hoher Salienz wird eher gesehen und geklickt.',
  },
  {
    term: 'Control',
    description:
      'Variante A – der Status quo. Alles Neue misst sich daran, sonst weißt du nicht, ob du wirklich gewonnen hast.',
  },
  {
    term: 'Challenger',
    description:
      'Variante B – die Hypothese im Ring. Gewinnt sie signifikant, hast du Evidenz statt Meinung.',
  },
  {
    term: 'Sample Size',
    description:
      'Wie viele Nutzer im Test stecken. Zu wenig Daten? Dann feierst du Rauschen als Erfolg.',
  },
  {
    term: 'Statistische Signifikanz',
    description:
      'Der Unterschied ist groß genug, dass Zufall unwahrscheinlich wird – kein Freifahrtschein, aber ein solides Stopp-Kriterium.',
  },
]

export const PERFORMANCE_DEMO_GLOSSARY: DemoGlossaryEntry[] = [
  {
    term: 'LCP',
    description:
      'Largest Contentful Paint – wann der größte sichtbare Inhalt erscheint. Zu langsam = Nutzer sehen „weißes Nichts“ und springen.',
  },
  {
    term: 'FID / INP',
    description:
      'First Input Delay bzw. Interaction to Next Paint: Wie schnell die Seite auf den ersten Klick reagiert. Schweres JS blockiert genau hier.',
  },
  {
    term: 'CLS',
    description:
      'Cumulative Layout Shift – wie stark Inhalte beim Laden „hüpfen“. Unfertige Bilder und Fonts sind Klassiker.',
  },
  {
    term: 'Bounce Rate',
    description:
      'Anteil der Besucher, die ohne Interaktion wieder gehen. Ab ~2,5 s Ladezeit steigt sie oft steil – und Conversion bricht mit.',
  },
  {
    term: 'Bundle',
    description:
      'Das ausgelieferte JavaScript-Paket. Mehr KB = mehr Download, Parse und Main-Thread-Last – spürbar auf Mittelklasse-Handys.',
  },
  {
    term: 'Latenz / TTFB',
    description:
      'Time to First Byte: wie lange der Server braucht, bevor überhaupt etwas ankommt. Hohe Latenz zieht alles nach hinten.',
  },
  {
    term: 'WebP',
    description:
      'Modernes Bildformat mit starker Kompression. Unkomprimierte PNGs/JPEGs fressen Bandbreite – WebP/AVIF entlasten LCP.',
  },
  {
    term: 'Lighthouse',
    description:
      'Audit-Score (u. a. Performance 0–100) aus Lab-Messungen. Kein Orakel, aber ein klarer Kompass für Tech-Schuld.',
  },
]
