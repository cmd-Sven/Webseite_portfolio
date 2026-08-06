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
          Sven Sieber
          <br />
          Ostlandweg 16
          <br />
          49205 Hasbergen
          <br />
          Deutschland
          <br />
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
        <h2 className="heading-section text-lg font-bold">2. Hosting</h2>
        <p>
          Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
          („Vercel“) gehostet. Beim Aufruf der Seite werden technisch notwendige Server-Logdaten
          verarbeitet (z. B. IP-Adresse, Zeitpunkt des Zugriffs, angeforderte Ressource, Browsertyp).
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und
          stabilen Betrieb der Website).
        </p>
        <p>
          Die Datenverarbeitung kann eine Übermittlung in die USA umfassen. Vercel stützt sich hierfür
          u. a. auf Standardvertragsklauseln bzw. vergleichbare Garantien. Weitere Informationen:{' '}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline"
          >
            Vercel Privacy Policy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">3. Backend und Authentifizierung (Supabase)</h2>
        <p>
          Für geschützte Bereiche (z. B. Admin-/Bewerbungsfunktionen) und zugehörige Datenhaltung
          wird Supabase (Supabase Inc.) als Backend- und Auth-Dienst genutzt. Dabei können
          Anmeldedaten, Sitzungsinformationen sowie von Ihnen in diesen Bereichen hinterlegte Inhalte
          verarbeitet und in der von Supabase betriebenen Infrastruktur gespeichert werden.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren
          Betrieb der Anwendungsfunktionen) bzw. – soweit ein Nutzungsverhältnis besteht – Art. 6
          Abs. 1 lit. b DSGVO. Details zur Datenverarbeitung durch den Anbieter:{' '}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline"
          >
            Supabase Privacy Policy
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">4. Kontaktaufnahme</h2>
        <p>
          Sie können per E-Mail (
          <a href="mailto:designer@sven-sieber.de" className="text-cyan-400 hover:underline">
            designer@sven-sieber.de
          </a>
          ) oder über den auf der Website angezeigten Mailto-Link Kontakt aufnehmen. Dabei werden die
          von Ihnen übermittelten Daten (mindestens E-Mail-Adresse und Inhalt der Nachricht) zur
          Bearbeitung der Anfrage verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
          (vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
          Beantwortung von Anfragen).
        </p>
        <p>
          Das sichtbare Kontaktformular auf der Portfolio-Seite speichert oder übermittelt derzeit
          keine Formulardaten an einen Server; es handelt sich um eine lokale Platzhalter-Umsetzung
          ohne Backend-Anbindung. Sobald eine Anbindung erfolgt, wird dieser Abschnitt angepasst.
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">5. Local Storage (Theme und Darstellung)</h2>
        <p>
          Zur Speicherung Ihrer Darstellungswünsche (z. B. Erscheinungsbild/Theme und Viewport-Modus)
          werden Werte im Local Storage Ihres Browsers abgelegt (
          <code className="text-slate-200">portfolio-appearance</code>,{' '}
          <code className="text-slate-200">portfolio-viewport</code>). Es handelt sich um technisch
          notwendige, lokal gespeicherte Einstellungen ohne Tracking-Zweck. Es werden keine
          Tracking-Cookies zu Analysezwecken gesetzt.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer komfortablen,
          wiederherstellbaren Darstellung).
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">6. Externe Schriftarten</h2>
        <p>
          Diese Seite lädt Schriftarten über Google Fonts (Google Ireland Limited / Google LLC). Beim
          Abruf der Schriftarten kann Ihre IP-Adresse an Google übermittelt werden. Rechtsgrundlage ist
          Art. 6 Abs. 1 lit. f DSGVO. Details:{' '}
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
        <h2 className="heading-section text-lg font-bold">7. Keine Web-Analyse zu Tracking-Zwecken</h2>
        <p>
          Es werden derzeit keine Drittanbieter-Analysedienste (z. B. Google Analytics, Plausible) zur
          Messung des Nutzerverhaltens auf dieser Website eingesetzt. Die unter „Analytics“
          dargestellten Inhalte sind Demonstrationen/Portfolio-Inhalte und erheben kein Besucherverhalten.
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">8. Ihre Rechte</h2>
        <p>
          Sie haben nach der DSGVO insbesondere folgende Rechte:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Auskunft über Ihre personenbezogenen Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung („Recht auf Vergessenwerden“, Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)</li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte genügt eine formlose Mitteilung an die oben genannte
          E-Mail-Adresse. Zudem haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu
          beschweren, z. B. beim{' '}
          <a
            href="https://www.lfd.niedersachsen.de/"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline"
          >
            Landesbeauftragten für den Datenschutz Niedersachsen
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="heading-section text-lg font-bold">9. Aktualität</h2>
        <p>Stand: August 2026</p>
      </section>
    </LegalPageLayout>
  )
}
