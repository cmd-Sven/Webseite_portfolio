import { LegalPageLayout } from '../components/LegalPageLayout'

export function ImpressumPage() {
  return (
    <LegalPageLayout title="Impressum">
      <section>
        <h2 className="heading-section text-lg font-bold">Angaben gemäß § 5 DDG</h2>
        <p>
          <strong>Sven Sieber</strong>
          <br />
          Ostlandweg 16
          <br />
          49205 Hasbergen
          <br />
          Deutschland
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">Kontakt</h2>
        <p>
          Telefon:{' '}
          <a href="tel:+491773878350" className="text-cyan-400 hover:underline">
            0177 3878350
          </a>
          <br />
          E-Mail:{' '}
          <a href="mailto:designer@sven-sieber.de" className="text-cyan-400 hover:underline">
            designer@sven-sieber.de
          </a>
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          Sven Sieber
          <br />
          Ostlandweg 16
          <br />
          49205 Hasbergen
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
    </LegalPageLayout>
  )
}
