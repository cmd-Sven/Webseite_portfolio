// Erster Eindruck: ~3 Sekunden. Dieser Kommentar: unbegrenzt. Fair trade.
import { ArrowRight, FileText, Sparkles } from 'lucide-react'
import { BlogTeaserSlider } from '../components/BlogTeaserSlider'
import { BlogTermHint } from '../components/BlogTermHint'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { RESUME_PDF_PATH } from '../data/navigation'
import type { BlogPost } from '../types/blog'

interface HeroSectionProps {
  onScrollTo: (id: string) => void
  onOpenBlogPost: (post: BlogPost) => void
}

export function HeroSection({ onScrollTo, onOpenBlogPost }: HeroSectionProps) {
  return (
    <section
      id="hero"
      className="scroll-section section-shell section-shell--hero section-in-view flex items-center justify-center"
    >
      <SectionRevealLayer className="max-w-6xl w-full">
        <RevealGroup className="hero-layout hero-banner">
          <div className="hero-banner__frame relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/35 backdrop-blur-[2px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              aria-hidden
            >
              <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
              <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
            </div>

            <div className="hero-banner__grid relative grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] items-stretch">
              <div className="hero-banner__copy flex flex-col justify-center gap-7 px-6 py-8 sm:px-8 md:px-10 md:py-10 lg:pr-6">
                <div className="hero-badge inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-cyan-800/30 bg-cyan-950/50 px-3.5 py-1.5 text-xs font-mono text-cyan-400">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0">
                    Spezialisierung Datenanalyse im Endspurt – Bereit für neue Herausforderungen
                  </span>
                </div>

                <h1 className="hero-title">
                  <span className="hero-subline block">
                    Hi, ich bin Sven. Ich verbinde
                  </span>
                  <span className="heading-display bg-clip-text text-transparent">
                    Design, Code und Daten zu messbarem Erfolg.
                  </span>
                </h1>

                <p className="max-w-xl text-sm leading-relaxed text-slate-400 md:text-lg">
                  Ich verknüpfe <BlogTermHint termKey="UX/UI" />, moderne{' '}
                  <BlogTermHint termKey="Full-Stack-Entwicklung" /> und fortgeschrittene KI-
                  <BlogTermHint termKey="Datenanalyse" />. Von der visuellen Ästhetik über die technische
                  Software-Architektur bis hin zur datenbasierten Optimierung baue ich digitale Ökosysteme,
                  die nicht nur gut aussehen, sondern performen.
                </p>

                <div className="flex flex-wrap gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => onScrollTo('expertise')}
                    className="btn btn-primary border-none bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:brightness-110"
                  >
                    Tech Stack & Core Skills
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                  <a
                    href={RESUME_PDF_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline gap-2 border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white"
                  >
                    <FileText className="h-4 w-4" />
                    Lebenslauf (PDF)
                  </a>
                </div>
              </div>

              <div className="hero-banner__blog relative flex items-stretch">
                <div
                  className="hero-banner__divider pointer-events-none absolute inset-y-8 left-0 hidden w-px bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent"
                  aria-hidden
                />
                <div className="flex w-full flex-col justify-center px-5 py-6 sm:px-7 md:px-8 md:py-8 lg:pl-8">
                  <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
                    Aus dem Blog
                  </p>
                  <BlogTeaserSlider
                    variant="hero"
                    onOpenPost={onOpenBlogPost}
                    onScrollToBlog={() => onScrollTo('blog')}
                  />
                </div>
              </div>
            </div>
          </div>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
