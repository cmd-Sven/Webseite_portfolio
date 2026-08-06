import type { BlogPost } from '../types/blog'

export const BLOG_COVER_PLACEHOLDER = '/blog/placeholder.svg'

/**
 * Blogbeiträge hier pflegen – neueste zuerst.
 * teaser: Kurztext in der Übersicht; content: Volltext (Absätze mit Leerzeile).
 * coverImage: optional, sonst Platzhalter
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'tableau-vs-custom',
    title: 'Tableau vs. Custom Dashboard: Maßanzug, Stangenware oder der clevere Modulbau?',
    date: '2026-06-14',
    coverImage: '/blog/tableau-vs-custom.webp',
    teaser:
      'Als Designer blicke ich bei Dashboards zuerst auf die Experience – und warum zwischen Tableau-Standard und React-Eigenbau Streamlit die spannende Brücke ist.',
    content: `Als Designer blicke ich bei Dashboards immer zuerst auf eins: die {{term:Experience}}. Wenn Daten nicht nur funktional verarbeitet, sondern für den Nutzer wirklich greifbar und intuitiv sein sollen, scheitern klassische {{term:BI-Tools}} oft an ihren starren Wänden.

Stehst du vor der klassischen „{{term:Build vs. Buy}}“-Frage, gibt es zwischen dem unflexiblen {{term:Tableau}}-Standard und dem aufwendigen {{term:React}}-Eigenbau zum Glück eine extrem spannende Brücke.

## 1. Die starre Mietwohnung: Tableau & Co.

Fremd-Tools wie Tableau sind datentechnisch absolute Kraftwerke. Sie fressen tonnenweise Daten und spucken im Handumdrehen komplexe Filter aus - für Analysten ein Traum und das bevorzugte Werkzeug.

**Der Vorteil:** Du ziehst quasi sofort ein. Die Pipelines stehen, du musst kein Rad neu erfinden.

**Der Haken (aus Designersicht):** Du bist extrem eingeengt. Die UI fühlt sich fast immer nach „Excel auf Steroiden“ an. Es bricht optisch aus jeder modernen Web-App aus und lässt sich kaum an eine individuelle Corporate Identity anbinden.

## 2. Der smarte Modulbau: Streamlit (Mehr gestalterischer Spielraum)

Aus eigener Erfahrung kann ich sagen: Wer deutlich mehr Freiheit sucht, ohne gleich ein ganzes {{term:Frontend-Framework}} hochzuziehen, findet in {{term:Streamlit}} eine hervorragende Alternative.

**Warum es flexibler ist:** Im Gegensatz zu starren BI-Tools bist du hier nicht in ein festes Template gepresst. Du baust die Oberfläche Schritt für Schritt auf, ordnest Elemente logisch an und kannst das Layout deutlich freier gestalten.

**Der Vorteil:** Es fühlt sich sofort viel mehr nach einem echten, maßgeschneiderten Produkt an, das man gerne herzeigt – perfekt für datengetriebene Prototypen, interne Tools oder {{term:MVP}}-Lösungen, bei denen die {{term:Usability}} im Vordergrund stehen soll.

## 3. Das Architekten-Eigenheim: Die Custom Web-App (Die absolute Freiheit)

Wenn du das Dashboard stattdessen komplett in einem modernen Frontend-Stack (wie React) hochziehst, wirst du zum echten Bauherrn – die {{term:Custom Web-App}} als Maßanzug.

**Der Vorteil:** Hier schlägt das Designer-Herz höher. Du hast die totale Kontrolle über jeden Pixel, jede {{term:Micro-Interaction}}, flüssige Animationen und {{term:Design-Tokens}}, die sich nahtlos in den Rest deiner App einfügen.

**Der Haken:** Du bist plötzlich dein eigener Klempner und musst dich um Performance, {{term:State-Management}} und das Rendering der Charts komplett selbst kümmern.

## Aber wann nimmst du was?

Die Entscheidung hängt von deinem Ziel ab:

**Für reine Zahlen-Profis:** Wenn interne Analysten den ganzen Tag tief in rohen Tabellen wühlen müssen und das Design absolut nebensächlich ist, reicht Tableau völlig aus.

**Für den schnellen, ansehnlichen Prototypen:** Willst du schnell eine interaktive Web-Anwendung auf die Beine stellen, die deutlich besser aussieht und sich flexibler steuern lässt als ein klassisches BI-Tool? Dann ist Streamlit ein echter Gewinn an gestalterischem Spielraum.

**Für das perfekte Kundenerlebnis:** Ist das Dashboard ein zentrales, direkt sichtbares Feature deiner {{term:SaaS}}-Plattform für Endkunden? Dann führt kein Weg an einer Custom Web-App vorbei.

## Fazit

Du musst dich nicht zwischen absolutem Stillstand und monatelanger Entwicklungsarbeit entscheiden. Mit Tools wie Streamlit gewinnst du spürbar mehr Freiheit für eine saubere {{term:UX}}, während du dir für die ultimative Marken-Präsenz den React-Eigenbau vorbehältst.`,
    tags: ['Dashboard', 'Architektur', 'UX/UI', 'Data', 'Streamlit'],
    readMinutes: 6,
  },
  {
    id: 'cro-hypothesen',
    title:
      'Von der Hypothese zum A/B-Test: Warum echte CRO bei UX, SEO und Datenanalyse anfängt',
    date: '2026-05-28',
    coverImage: '/blog/cro-hypothesen.webp',
    teaser:
      'Warum echte CRO nicht beim Button-Blau anfängt – sondern bei Search Intent, UX-Research und sauberen Hypothesen.',
    content: `Conversion-Optimierung beginnt verdammt selten mit der Frage: „Lass uns doch mal den Button blau färben, das bringt bestimmt mehr Klicks.“

Ganz ehrlich: Wer so an die Sache herangeht, wirft im Grunde nur Dartpfeile in einem dunklen Raum. Schlimmer noch: Viele optimieren stur irgendwelche Checklisten ab, ohne jemals zu hinterfragen, ob die Maßnahmen überhaupt zum echten Nutzerbedürfnis passen.

In meiner Praxis – an der Schnittstelle von {{term:UX-Design}}, {{term:SEO}} und {{term:Datenanalyse}} – habe ich gelernt, dass man ganz woanders ansetzen muss. Echte {{term:CRO}} startet dort.

## 1. SEO ist mehr als Keywords: Die Jagd nach dem echten Intent

Guter Traffic fällt nicht vom Himmel, und er ist auch nicht gleichzusetzen mit reinen Besucherzahlen. Wer SEO nur als Technik-Checkliste oder das Einbauen von Keywords versteht, verpasst den Kern.

Echtes SEO bedeutet für mich: {{term:Search Intent}} verstehen. Mit welcher Erwartung kommt ein Nutzer über Google auf meine Seite? Wenn die Leute zwar über ein bestimmtes Keyword reinströmen, aber nach fünf Sekunden wieder abspringen, stimmt etwas fundamental nicht. Das Problem liegt dann nicht am {{term:Meta-Title}}, sondern daran, dass die Seite dem Nutzer nicht das liefert, was er gesucht hat. Bevor ich also an einer {{term:Conversion}} schraube, muss ich verstehen, warum jemand überhaupt den Weg dorthin gefunden hat.

## 2. Google Analytics: Zahlen lesen vs. Daten verstehen

Google {{term:Analytics}} ist für viele ein Buch mit sieben Siegeln. Man klickt sich durch endlose Dashboards, sieht Sitzungen, Verweildauern und Absprungraten – aber versteht man wirklich, was dort passiert?

Daten zu lesen ist leicht. Man sieht: „Oh, die {{term:Absprungrate}} auf Seite X ist hoch.“
Die Daten aber zu verstehen bedeutet, die Geschichte dahinter zu begreifen:

Warum brechen die Nutzer hier ab?

Ist der {{term:Call-to-Action}} unsichtbar?

Erwarten sie etwas völlig anderes, weil die Suchmaschine sie falsch abgeholt hat?

Erst wenn man aufhört, sich von bunten Metriken blenden zu lassen, und anfängt, das menschliche Verhalten dahinter zu hinterfragen, fängt die echte Analyse an.

## 3. Die Brücke zum Nutzer: Zielgruppen, Personas & Customer Journeys

Zahlen, Suchanfragen und Analytics-Kurven zeigen mir zwar, dass etwas passiert – aber sie erklären selten das Warum. Genau hier schlägt das Herz meiner Arbeit als {{term:UX}}-Designer.

Ich verlasse mich nicht auf vage Vermutungen, sondern steige tief in die {{term:UX-Research}}-Toolbox:

**Zielgruppen analysieren:** Wer nutzt das Produkt wirklich und wer ist nur zufällig hier?

**{{term:Use Cases}} betrachten:** In welchen konkreten Situationen oder Stressmomenten öffnen die Leute die Seite?

**{{term:Personas}} erstellen:** Den anonymen Traffic mit echten Gesichtern, Motivationen und Frustrationen füllen.

**{{term:Customer Journeys}} abbilden:** Den gesamten Weg des Nutzers nachzeichnen – von der ersten Berührung über Google bis zum finalen Checkout oder Abbruch.

Erst wenn ich diese psychologischen und strukturellen Wege verstehe, greifen SEO-Daten und Analytics-Metriken wie Zahnräder ineinander.

## 4. Erst die Diagnose, dann die Hypothese

Aus diesem tiefen Zusammenspiel aus UX-Erkenntnissen, SEO-Kontext und Analytics-Daten leite ich testbare {{term:Hypothesen}} ab. Das hat rein gar nichts mit Bauchgefühl-Wünschen wie „Wir brauchen jetzt einfach mal ein schickes Redesign“ zu tun.

Stattdessen formuliere ich präzise Annahmen: „Wenn wir im letzten {{term:Checkout}}-Schritt zwei überflüssige Felder streichen, weil unsere Personas laut {{term:Customer Journey}} genau hier durch kognitive Überlastung aussteigen, senken wir messbar die Abbruchrate.“
Das visuelle UI und jede Zeile Code kommen erst dann ins Spiel, wenn die logische Kette absolut wasserdicht ist.

## 5. Der Schild gegen das Rauschen: Statistik statt Hoffnung

Wenn es dann an den echten oder simulierten {{term:A/B-Test}} geht, lauert die nächste Stolperfalle: zu frühes Jubeln über scheinbare Erfolge, die in Wahrheit nur statistisches Rauschen sind.

Ein guter Test braucht eiserne Stopp-Kriterien. Ob {{term:Chi-Quadrat-Test}} oder {{term:bayesianische Statistik}} – je nach Datenmenge ({{term:Sample Size}}) setze ich auf mathematische Methoden, die mich davor bewahren, auf Zufall zu optimieren. Schließlich will ich keine Features launchen, die nur deshalb gewonnen haben, weil an einem Dienstagvormittag zufällig ein paar mehr optimistische Nutzer da waren.

## Das Fazit: Nichts ungefragt hinnehmen

Genau diese Kombination aus fundiertem UX-Design, SEO-Verständnis, tiefem Analytics-Wissen und analytischer Disziplin prägt meine Arbeit. Ich nehme Best-Practice-Tipps nicht einfach so hin, sondern hinterfrage jede Kennzahl, jeden Klick und jedes Nutzerverhalten.

Wer versteht, wie Menschen ticken, wie man Daten richtig liest und eine {{term:Hypothese}} sauber testet, baut am Ende eben keine Webseiten mehr auf bloßes Glück – sondern digitale Produkte, die handwerklich überzeugen und messbar funktionieren.`,
    tags: ['CRO', 'UX-Design', 'SEO', 'Datenanalyse'],
    readMinutes: 8,
  },
  {
    id: 'react-vue-bridge',
    title: 'React + Vue in einer SPA: Wann sich Micro-Frontends lohnen',
    date: '2026-04-12',
    coverImage: '/blog/react-vue-bridge.webp',
    teaser:
      'Deine Haupt-App läuft in React, aber für einen Rechner oder Konfigurator will ein Team Vue nutzen? Mit Vue-Islands geht das – ohne die ganze App neu zu schreiben.',
    content: `Deine Haupt-App läuft in {{term:React}}, aber für einen bestimmten Rechner oder Konfigurator will ein Team unbedingt {{term:Vue}} nutzen? Kein Grund, die ganze {{term:SPA}} neu zu schreiben – und oft auch kein Grund für ein volles {{term:Micro-Frontends}}-Setup.

Für solche isolierten Bausteine reicht oft eine {{term:Vue-Island}}. Das ist ein kleines Vue-Modul, das sich unauffällig in deine React-Umgebung einklinkt – wie ein maßgefertigtes Regal, das perfekt in eine bestehende Wand passt.

## Die drei goldenen Regeln der Zusammenarbeit

Damit sich React und Vue nicht in die Quere kommen, brauchst du klare Absprachen:

**Daten rein ({{term:Props}}):** Welche Infos bekommt Vue von React? (z. B. den aktuellen User-Status).

**Signale raus ({{term:Events}}):** Wie sagt Vue Bescheid, wenn der Nutzer fertig ist? (z. B. „Der Rechner ist durch, aktualisiere den Warenkorb!“).

**Der Chef bleibt React:** Die Haupt-App behält die Kontrolle. Vue kümmert sich nur isoliert um sein eigenes kleines Revier.

## Lohnt sich das?

**Das Gute:** Spezialisierte Teams können in ihrem gewohnten Stack arbeiten, während der Nutzer am Ende eine völlig nahtlose App erlebt.

**Das Schlechte:** Du holst dir zwei {{term:Build-Pipelines}} ins Projekt und musst aktiv aufpassen, dass Design-Elemente (wie Buttons oder Fonts) nicht plötzlich unterschiedlich aussehen.

**Fazit:** {{term:Vue-Islands}} in einer React-App sind kein Freifahrtschein für ein wildes {{term:Framework}}-Chaos, sondern ein cleverer, pragmatischer Werkzeug-Griff, wenn du gezielt Features integrieren willst, ohne das Rad neu zu erfinden.`,
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
    content: `Willst du nur eine Abkürzung über den Teich nehmen, charterst du sicherlich kein riesiges Frachtschiff. Genau so verhält es sich oft mit großen {{term:Chart-Libraries}} in Dashboards.

Schwere Bibliotheken sind fantastisch, wenn Nutzer Daten interaktiv erforschen wollen (zoomen, filtern, klicken). Aber für ein festes Reporting-Dashboard sind sie oft schlichtweg Overkill – sie blähen das Projekt unnötig auf und bremsen die Performance aus.

## Warum rohe SVGs oft die bessere Wahl sind

Mit ein paar gezielten {{term:SVG}}-Pfaden und Text-Labels baust du maßgeschneiderte Charts, die sehr performant sind. Der riesige Bonus: Du hast die volle Kontrolle über den Code und kannst {{term:Barrierefreiheit}} ({{term:Accessibility}}) von Anfang an sauber einbauen (z. B. mit echten {{term:ARIA}}-Rollen für Screenreader).

## Wie man es schlank und flüssig hält

Damit das Dashboard auch auf älteren Geräten butterweich läuft, helfen ein paar einfache Regeln:

**Einmal rechnen statt dauernd schwitzen:** Wir normalisieren die Rohdaten einmal im Client, statt bei jeder kleinsten Bewegung im Browser unnötig Rechenleistung zu verbrennen.

**Smart cachen ({{term:Caching}}):** Pfade, die sich nicht verändern, werden im Speicher behalten. Der Browser rendert nur das, was wirklich neu ist.

**Farben aus dem Baukasten (Tokens):** Keine harten Farbwerte im Code, sondern {{term:Design-Tokens}}. So springt das Dashboard sauber zwischen {{term:Light-Mode}}, {{term:Dark-Mode}} und {{term:Kontrastmodus}} hin und her, ohne dass etwas kaputtgeht.

## Das Ergebnis

Ein Dashboard, das auch auf schwächeren Geräten flüssig bleibt, barrierefrei funktioniert und sich am Ende anfühlt wie ein echtes, fertiges Produkt – und nicht wie eine überladene Technik-Spielerei.`,
    tags: ['SVG', 'Performance', 'Accessibility'],
    readMinutes: 5,
  },
  {
    id: 'design-tokens',
    title: 'Design Tokens: Die geheime Sprache zwischen Design und Code',
    date: '2026-01-18',
    coverImage: '/blog/design-tokens.webp',
    teaser:
      'Stell dir vor, jeder Raum hat seinen eigenen Lichtschalter – und du willst im ganzen Haus auf Warmweiß umstellen. Design Tokens lösen genau dieses Problem im Webdesign.',
    content: `Stell dir vor, du baust ein Haus und hast für jeden Raum einen eigenen Lichtschalter, der starr mit einer bestimmten Glühbirne verkabelt ist. Willst du plötzlich im ganzen Haus auf stimmungsvolles Warmweiß umstellen, musst du durch jedes Zimmer rennen und jede Birne einzeln auswechseln.

Im Webdesign ist das oft nicht anders – es sei denn, du nutzt {{term:Design Tokens}}.

## Die universelle Schnittstelle

Design Tokens sind die Brücke zwischen zwei Welten, die sich früher oft missverstanden haben: Design und Engineering. Statt Farben, Abstände und Schriftgrößen wild im Code zu verteilen, definieren wir sie einmal zentral – im Design als {{term:Figma-Variablen}} und im Code als {{term:CSS Custom Properties}} oder {{term:Tailwind}}-Erweiterungen.

## Der wichtigste Trick: Semantic statt Decorative

Das eigentliche Geheimnis hinter sauberen Tokens ist eine eiserne Disziplin beim Benennen. Es macht einen riesigen Unterschied, ob du ein Design-Element nach seinem Aussehen benennst oder nach seiner Bedeutung:

**{{term:Decorative Tokens}} (falsch gedacht):** gray-800 (Das beschreibt nur: „Hey, das ist ein dunkles Grau“).

**{{term:Semantic Tokens}} (clever gemacht):** surface-elevated (Das beschreibt den Zweck: „Das ist eine leicht angehobene Oberfläche“).

Warum das den Alltag rettet? Wenn du gray-800 nutzt und merkst, dass der Ton im {{term:Dark-Mode}} nicht passt, musst du im schlimmsten Fall an hunderten Stellen im Code nachbessern. Nutzt du hingegen surface-elevated, bleibt der Name immer derselbe. Du tauschst im Hintergrund einfach nur den Wert aus – und das System weiß genau, was zu tun ist.

## Ein Schalter für alles: Light, Dark & Kontrast

Genau das machen wir uns zunutze: Über ein simples HTML-Attribut wie {{term:data-appearance}} und clevere CSS-Variablen steuern wir im Portfolio, ob die Seite im hellen, dunklen oder kontrastreichen Barrierefreiheitsmodus erstrahlt.

Das Geniale daran: Die Komponente selbst – zum Beispiel eine einfache Card – bleibt zu 100 % exakt dieselbe. Sie muss nicht umgeschrieben werden. Sie passt sich einfach an, weil sich im Hintergrund die Token-Werte verändern.

{{theme-demo}}

## Das Fazit

Design Tokens sind kein trockener Theorie-Kram, sondern das Fundament für sauberes, skalierbares Frontend. Sie retten dich vor dem unübersichtlichen CSS-Chaos, machen {{term:Themes}} und {{term:Barrierefreiheit}} zum Kinderspiel und sorgen dafür, dass Designer und Entwickler endlich denselben Dialekt sprechen.`,
    tags: ['Design', 'CSS', 'Architecture'],
    readMinutes: 5,
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
