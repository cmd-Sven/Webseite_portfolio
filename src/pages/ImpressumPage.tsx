import { LegalPageLayout } from '../components/LegalPageLayout'

export function ImpressumPage() {
  return (
    <LegalPageLayout title="Impressum">
      <section>
        <h2 className="heading-section text-lg font-bold">Angaben gemäß § 5 TMG</h2>
        <p>
          <strong>[Vorname Nachname – Platzhalter]</strong>
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ Ort]
          <br />
          Deutschland
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">Kontakt</h2>
        <p>
          Telefon: [Telefonnummer]
          <br />
          E-Mail: [ihre.email@beispiel.de]
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          [Vorname Nachname]
          <br />
          [Anschrift wie oben]
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          . Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <p className="text-xs text-slate-500 italic">
        Hinweis: Diese Seite enthält Platzhalterdaten. Bitte ersetzen Sie alle Felder in eckigen
        Klammern durch Ihre echten Angaben vor der Veröffentlichung.
      </p>
    </LegalPageLayout>
  )
}
