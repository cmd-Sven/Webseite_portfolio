import { Mail } from 'lucide-react'
import { PortfolioCard, PortfolioCardSm } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'

export function ContactSection() {
  return (
    <section id="contact" className="scroll-section section-shell flex items-center justify-center">
      <SectionRevealLayer className="max-w-4xl w-full">
        <RevealGroup className="contact-columns flex flex-col md:flex-row gap-12 items-center justify-center h-full">
          <div className="w-full md:w-1/2 space-y-6">
            <SectionHeader eyebrow="Get in touch" title="Lass uns über Synergien sprechen." accent="cyan" />
            <p className="text-sm leading-relaxed text-slate-400">
              Sie suchen einen vielseitigen Teamplayer, der die Lücke zwischen Design, Entwicklung und
              Business Intelligence schließt? Ich freue mich auf Ihre Einladung zu einem Kennenlerngespräch.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <PortfolioCardSm glow="card-glow--cyan-violet" className="w-10 h-10 !p-0 flex items-center justify-center text-cyan-400">
                  <Mail className="w-5 h-5" />
                </PortfolioCardSm>
                <a
                  href="mailto:designer@sven-sieber.de"
                  className="hover:text-cyan-400 transition-colors"
                >
                  designer@sven-sieber.de
                </a>
              </div>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <PortfolioCardSm glow="card-glow--cyan-violet" className="w-10 h-10 !p-0 flex items-center justify-center text-cyan-400">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </PortfolioCardSm>
                <span>github.com/svensieber</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <PortfolioCard glow="card-glow--cyan-violet" hover="cyan" className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  alert('Vielen Dank für Ihre Nachricht! Ich werde mich zeitnah bei Ihnen melden.')
                }}
                className="space-y-4"
              >
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-300 text-xs">Unternehmen / Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Muster GmbH / Ansprechpartner"
                    required
                    className="input input-bordered bg-[#0a0b10] border-slate-800 text-sm focus:border-cyan-500 w-full rounded-xl"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-300 text-xs">E-Mail-Adresse</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ihre.firma@unternehmen.de"
                    required
                    className="input input-bordered bg-[#0a0b10] border-slate-800 text-sm focus:border-cyan-500 w-full rounded-xl"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-slate-300 text-xs">Nachricht</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Sprechen wir über Ihre offene Vakanz oder ein konkretes Projekt..."
                    required
                    className="textarea textarea-bordered bg-[#0a0b10] border-slate-800 text-sm focus:border-cyan-500 w-full rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary bg-gradient-to-r from-cyan-500 to-violet-600 border-none text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-cyan-500/20 w-full rounded-xl"
                >
                  Kontakt herstellen
                </button>
              </form>
            </PortfolioCard>
          </div>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
