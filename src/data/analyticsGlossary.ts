export interface GlossaryEntry {
  term: string
  description: string
}

export const ANALYTICS_GLOSSARY = {
  traffic: {
    term: 'Monatlicher Traffic',
    description:
      'Anzahl der Besucherinnen und Besucher auf der Website pro Monat. Mehr Traffic bedeutet mehr potenzielle Conversions – bei gleicher Conversion-Rate steigt das Volumen.',
  },
  conversionRate: {
    term: 'Conversion-Rate',
    description:
      'Anteil der Besucher, die eine gewünschte Aktion abschließen (z. B. Kauf, Anmeldung), angegeben in Prozent. Formel: Conversions ÷ Besucher × 100.',
  },
  avgOrderValue: {
    term: 'Durchschnittlicher Warenkorb',
    description:
      'Durchschnittlicher Bestellwert pro Conversion in Euro. Zusammen mit der Conversion-Rate bestimmt er den erzielbaren Umsatz.',
  },
  uxLift: {
    term: 'Erwarteter UX-Design Lift',
    description:
      'Geschätzte prozentuale Verbesserung der Conversion-Rate durch UX-Optimierungen (klarere Navigation, schnellere Ladezeiten, bessere Formulare). Basiert auf typischen CRO-Benchmarks.',
  },
  cro: {
    term: 'CRO',
    description:
      'Conversion Rate Optimization – systematische Steigerung der Conversion-Rate durch Datenanalyse, Hypothesen, A/B-Tests und UX-Verbesserungen.',
  },
  userTraffic: {
    term: 'User Traffic (Wochenverlauf)',
    description:
      'Verlauf aktiver Sitzungen über die Woche. Zeigt, ob Redesigns oder Kampagnen zu mehr wiederkehrenden Besuchen führen.',
  },
  funnelDropOff: {
    term: 'Conversion Funnel Drop-off',
    description:
      'Trichter-Darstellung der Customer Journey: Wo steigen Nutzer von einer Stufe zur nächsten ab? Hilft, die größten Conversion-Hürden zu priorisieren.',
  },
  performanceCro: {
    term: 'Performance vs. CRO Impact',
    description:
      'Zusammenhang zwischen Ladezeit und Conversion-Rate. Langsamere Seiten korrelieren oft mit niedrigeren Conversions – jede eingesparte Millisekunde kann messbar wirken.',
  },
  lineChart: {
    term: 'Line Chart',
    description: 'Liniendiagramm: zeigt Entwicklung eines Kennwerts über Zeit oder Kategorien (hier: Wochentage).',
  },
  funnelMap: {
    term: 'Funnel Map',
    description:
      'Visuelle Abbildung des Conversion-Trichters – Breite der Balken entspricht dem verbleibenden Anteil der Nutzer je Schritt.',
  },
  scatterPlot: {
    term: 'Scatter Plot',
    description:
      'Streudiagramm: jeder Punkt ist ein Messwert. Hier Ladezeit (X) vs. Conversion-Rate (Y) – Muster und Ausreißer werden sichtbar.',
  },
} as const satisfies Record<string, GlossaryEntry>

export type AnalyticsGlossaryKey = keyof typeof ANALYTICS_GLOSSARY
