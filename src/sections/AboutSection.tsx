// Über mich in Codeform: ehrlicher als LinkedIn, kürzer als das dritte Kaffee-Meeting.
import type { ReactNode } from 'react'
import { MapPin, User } from 'lucide-react'
import { ABOUT_PROFILE } from '../data/about'
import { BlogTermHint } from '../components/BlogTermHint'
import { BrandLogo } from '../components/BrandLogo'
import { PortfolioCard } from '../components/PortfolioCard'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'

/** Animiertes WebP (1:1, nicht neu gerendert — Optimizer würde Frames killen). */
const ABOUT_ILLUSTRATION_SRC = '/about/animation-sieber-computer.webp'

const ABOUT_PARAGRAPHS: ReactNode[] = [
  <>
    Ich verbinde Mediengestaltung, <BlogTermHint termKey="UX/UI" /> und{' '}
    <BlogTermHint termKey="Full-Stack-Entwicklung" /> mit einem wachsenden Fokus auf{' '}
    <BlogTermHint termKey="Datenanalyse" />. Mein Ziel: digitale Produkte, die nicht nur gut
    aussehen, sondern messbar performen.
  </>,
  <>
    In Projekten arbeite ich strukturiert von der <BlogTermHint termKey="Hypothese" /> über Prototyp
    bis zur Auswertung – ob <BlogTermHint termKey="Conversion-Optimierung" />,{' '}
    <BlogTermHint termKey="Dashboard" /> oder interoperable Frontends mit React und Vue.
  </>,
  <>
    Aktuell schließe ich meine Spezialisierung zum Datenanalysten ab und suche ein Umfeld, in dem
    Design, Technik und <BlogTermHint termKey="Business Intelligence" /> zusammenwirken.
  </>,
]

const ABOUT_HIGHLIGHTS: ReactNode[] = [
  <>T-Shaped: breite UX/UI & Dev, tiefe Datenkompetenz</>,
  <>React, Vue, TypeScript, Tailwind, SVG-Visualisierung</>,
  <>
    <BlogTermHint termKey="CRO" />, Funnel-Analyse, A/B-Tests und Denken in{' '}
    <BlogTermHint termKey="KPI">KPIs</BlogTermHint>
  </>,
]

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

export function AboutSection() {
  const { linkedInUrl, xingUrl, location, role } = ABOUT_PROFILE

  return (
    <section
      id="about"
      className="scroll-section section-shell relative flex items-center justify-center overflow-hidden"
    >
      {/* Vollflächen-Hintergrund hinter beiden Spalten */}
      <div
        className="about-bg-illustration pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        <img
          src={ABOUT_ILLUSTRATION_SRC}
          alt=""
          width={500}
          height={500}
          className="about-bg-illustration__img absolute top-0 object-contain object-top opacity-30 sm:opacity-40 lg:opacity-65"
          loading="lazy"
          decoding="async"
        />
      </div>

      <SectionRevealLayer className="relative z-10 max-w-5xl w-full">
        <RevealGroup className="about-columns flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-xl">
            <SectionHeader eyebrow="Profil" title="Über mich" accent="cyan" />

            <PortfolioCard
              glow="card-glow--cyan-violet"
              hover="cyan"
              className="about-profile-card relative z-10 flex flex-col gap-6 p-6 sm:p-8 md:p-9"
            >
              <header className="flex flex-wrap items-center gap-4 border-b border-slate-800/80 pb-5">
                <BrandLogo variant="mark" size="xl" className="shrink-0" />
                <div className="min-w-0 space-y-1.5">
                  <p className="heading-section text-lg font-bold sm:text-xl">Sven Sieber</p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-violet-400" />
                      {role}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      {location}
                    </span>
                  </p>
                </div>
              </header>

              <div className="space-y-3.5 text-sm leading-relaxed text-slate-300 md:text-[15px]">
                {ABOUT_PARAGRAPHS.map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
              </div>

              <ul className="grid gap-2 sm:grid-cols-1">
                {ABOUT_HIGHLIGHTS.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 rounded-xl border border-slate-800/60 bg-slate-950/40 px-3 py-2.5 text-xs text-slate-400"
                  >
                    <span className="mt-0.5 text-cyan-400">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto space-y-3 border-t border-slate-800/80 pt-5">
                <p className="text-xs leading-relaxed text-slate-400">
                  Vernetze dich gerne auf LinkedIn oder Xing – dort teile ich Updates zu Projekten,
                  Datenanalyse und Themen rund ums <BlogTermHint termKey="Frontend" />.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm flex-1 gap-2 border border-[#0a66c2]/50 bg-[#0a66c2]/20 font-semibold normal-case text-slate-100 hover:border-[#0a66c2] hover:bg-[#0a66c2]/35"
                    aria-label="LinkedIn-Profil von Sven Sieber (öffnet in neuem Tab)"
                  >
                    <LinkedInIcon className="h-4 w-4 shrink-0" />
                    LinkedIn
                  </a>
                  <a
                    href={xingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm flex-1 gap-2 border border-[#026466]/60 bg-[#026466]/25 font-semibold normal-case text-slate-100 hover:border-[#026466] hover:bg-[#026466]/40"
                    aria-label="Xing-Profil von Sven Sieber (öffnet in neuem Tab)"
                  >
                    <XingIcon className="h-4 w-4 shrink-0" />
                    Xing
                  </a>
                </div>
              </div>
            </PortfolioCard>
          </div>

          {/* Spalte 2: Leerplatz für visuelle Balance */}
          <div className="hidden min-h-0 flex-1 lg:block" aria-hidden="true" />
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
