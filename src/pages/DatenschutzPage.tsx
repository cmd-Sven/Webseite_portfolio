import { LegalPageLayout } from '../components/LegalPageLayout'

export function DatenschutzPage() {
  return (
    <LegalPageLayout title="Datenschutzerklärung">
      <section>
        <h2 className="heading-section text-lg font-bold">1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          <br />
          <br />
          [Vorname Nachname – Platzhalter]
          <br />
          [Straße und Hausnummer]
          <br />
          [PLZ Ort]
          <br />
          E-Mail:{' '}
          <a href="mailto:designer@sven-sieber.de" className="text-cyan-400 hover:underline">
            designer@sven-sieber.de
          </a>
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">2. Hosting</h2>
        <p>
          Diese Website wird bei [Hosting-Anbieter, z. B. Vercel Inc.] gehostet. Beim Aufruf der
          Seite werden technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt des Zugriffs,
          Browsertyp) in Server-Logfiles verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse an einem sicheren Betrieb).
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">3. Kontaktformular</h2>
        <p>
          Wenn Sie das Kontaktformular nutzen, werden die von Ihnen eingegebenen Daten (Name,
          E-Mail, Nachricht) zur Bearbeitung Ihrer Anfrage verarbeitet. Rechtsgrundlage ist Art. 6
          Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO.
          <br />
          <br />
          <em>
            Hinweis: Das Kontaktformular ist derzeit noch nicht an einen E-Mail-Dienst angebunden
            (Platzhalter-Implementierung). Nach Anbindung muss dieser Abschnitt angepasst werden.
          </em>
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">4. Externe Schriftarten</h2>
        <p>
          Diese Seite kann Schriftarten von Google Fonts laden. Dabei können Daten an Google
          übermittelt werden. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Details:{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline"
          >
            Google Datenschutzerklärung
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">5. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit und Widerspruch. Beschwerden können Sie bei einer Aufsichtsbehörde
          einreichen, z. B. beim Landesbeauftragten für den Datenschutz Ihres Bundeslandes.
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">6. Aktualität</h2>
        <p>Stand: [Monat Jahr] — Platzhalter, bitte vor Go-Live aktualisieren.</p>
      </section>

      <p className="text-xs text-slate-500 italic">
        Hinweis: Diese Datenschutzerklärung ist eine Vorlage mit Platzhalterdaten und ersetzt keine
        rechtliche Beratung.
      </p>
    </LegalPageLayout>
  )
}
