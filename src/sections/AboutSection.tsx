import { ArrowRight, MapPin, User } from 'lucide-react'
import { ABOUT_PROFILE } from '../data/about'
import { PortfolioCard } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function XingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.188 0c-.517 0-.741.325-.927.66 0 0-7.455 13.224-7.702 13.657.015.024.919 1.676.919 1.676l4.588-8.377c.276-.526.702-.71 1.096-.71.39 0 .845.19 1.071.71l4.588 8.37s.914-1.663.93-1.682C20.991 13.66 13.535.66 13.535.66 13.316.325 13.089 0 12.572 0h-3.283c-.517 0-.742.325-.961.66 0 0-7.455 13.224-7.702 13.657.015.024.919 1.676.919 1.676l5.236-9.532c.276-.526.702-.71 1.095-.71.39 0 .848.19 1.072.71l2.602 4.74v6.668h3.157V0h-3.283z" />
    </svg>
  )
}

interface AboutSectionProps {
  onScrollTo: (id: string) => void
}

export function AboutSection({ onScrollTo }: AboutSectionProps) {
  const { linkedInUrl, xingUrl, location, role, paragraphs, highlights } = ABOUT_PROFILE

  return (
    <section id="about" className="scroll-section flex items-center justify-center px-6 md:px-12 py-16">
      <SectionRevealLayer className="max-w-6xl w-full">
        <RevealGroup className="about-columns flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch">
          <div className="w-full lg:w-3/5 flex flex-col justify-center space-y-5">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Profil</span>
              <h2 className="heading-section section-heading-xl text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
                Über mich
              </h2>
              <p className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  {role}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {location}
                </span>
              </p>
            </div>

            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              {paragraphs.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
            </div>

            <ul className="space-y-2">
              {highlights.map((item) => (
                <li key={item} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">▸</span>
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onScrollTo('expertise')}
              className="btn btn-sm btn-ghost gap-2 text-slate-400 hover:text-white w-fit"
            >
              <span>Weiter zu Expertise</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full lg:w-2/5 flex flex-col justify-center">
            <PortfolioCard glow="card-glow--cyan-violet" hover="cyan" className="h-full flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center text-2xl font-black text-slate-950 shrink-0">
                  S
                </div>
                <div>
                  <p className="heading-section font-bold text-lg">Sven Sieber</p>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{role}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Vernetze dich gerne auf LinkedIn oder Xing – dort teile ich Updates zu Projekten, Datenanalyse
                und Frontend-Themen.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <a
                  href={linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm flex-1 gap-2 bg-[#0a66c2]/20 border border-[#0a66c2]/50 text-slate-100 hover:bg-[#0a66c2]/35 hover:border-[#0a66c2] normal-case font-semibold"
                  aria-label="LinkedIn-Profil von Sven Sieber (öffnet in neuem Tab)"
                >
                  <LinkedInIcon className="w-4 h-4 shrink-0" />
                  LinkedIn
                </a>
                <a
                  href={xingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm flex-1 gap-2 bg-[#026466]/25 border border-[#026466]/60 text-slate-100 hover:bg-[#026466]/40 hover:border-[#026466] normal-case font-semibold"
                  aria-label="Xing-Profil von Sven Sieber (öffnet in neuem Tab)"
                >
                  <XingIcon className="w-4 h-4 shrink-0" />
                  Xing
                </a>
              </div>
            </PortfolioCard>
          </div>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
