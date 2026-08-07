import { Mail } from 'lucide-react'
import { BlogTermHint } from '../components/BlogTermHint'
import { PortfolioCard, PortfolioCardSm } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'

// Wenn du diesen Code liest, hast du entweder zu viel Freizeit oder bist ein sehr gründlicher Recruiter. Respekt!
export function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-section section-shell scroll-section--contact flex items-center justify-center"
    >
      <SectionRevealLayer className="max-w-4xl w-full min-w-0">
        <RevealGroup className="contact-columns flex h-auto min-w-0 flex-col items-stretch justify-center gap-8 md:flex-row md:items-center md:gap-12">
          <div className="contact-columns__copy w-full min-w-0 space-y-5 md:w-1/2 md:space-y-6">
            <SectionHeader eyebrow="Get in touch" title="Lass uns über Synergien sprechen." accent="cyan" />
            <p className="text-sm leading-relaxed text-slate-400">
              Sie suchen einen vielseitigen Teamplayer, der die Lücke zwischen Design, Entwicklung und{' '}
              <BlogTermHint termKey="Business Intelligence" /> schließt? Ich freue mich auf Ihre Einladung
              zu einem Kennenlerngespräch.
            </p>

            <div className="space-y-3">
              <div className="flex min-h-11 items-center gap-3 text-sm text-slate-300">
                <PortfolioCardSm glow="card-glow--cyan-violet" className="flex h-10 w-10 !p-0 items-center justify-center text-cyan-400">
                  <Mail className="h-5 w-5" />
                </PortfolioCardSm>
                <a
                  href="mailto:designer@sven-sieber.de"
                  className="min-w-0 break-all transition-colors hover:text-cyan-400"
                >
                  designer@sven-sieber.de
                </a>
              </div>
              <div className="flex min-h-11 items-center gap-3 text-sm text-slate-300">
                <PortfolioCardSm glow="card-glow--cyan-violet" className="flex h-10 w-10 !p-0 items-center justify-center text-cyan-400">
                  <svg
                    className="h-5 w-5"
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
                <span className="min-w-0 break-all">github.com/svensieber</span>
              </div>
            </div>
          </div>

          <div className="contact-columns__form w-full min-w-0 md:w-1/2">
            <PortfolioCard glow="card-glow--cyan-violet" hover="cyan" className="contact-form-card space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  alert('Vielen Dank für Ihre Nachricht! Ich werde mich zeitnah bei Ihnen melden.')
                }}
                className="contact-form space-y-4"
              >
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs text-slate-300">Unternehmen / Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Muster GmbH / Ansprechpartner"
                    required
                    className="contact-form__field input input-bordered w-full rounded-xl border-slate-800 bg-[#0a0b10] text-sm text-slate-100 focus:border-cyan-500"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs text-slate-300">E-Mail-Adresse</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ihre.firma@unternehmen.de"
                    required
                    className="contact-form__field input input-bordered w-full rounded-xl border-slate-800 bg-[#0a0b10] text-sm text-slate-100 focus:border-cyan-500"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs text-slate-300">Nachricht</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Sprechen wir über Ihre offene Vakanz oder ein konkretes Projekt..."
                    required
                    className="contact-form__field textarea textarea-bordered w-full rounded-xl border-slate-800 bg-[#0a0b10] text-sm text-slate-100 focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="contact-form__submit btn btn-primary w-full rounded-xl border-none bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110"
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
