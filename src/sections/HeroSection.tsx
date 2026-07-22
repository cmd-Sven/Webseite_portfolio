import { ArrowRight, FileText, Sparkles } from 'lucide-react'
import { BlogTeaserSlider } from '../components/BlogTeaserSlider'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { RESUME_PDF_PATH } from '../data/navigation'
import type { BlogPost } from '../types/blog'

interface HeroSectionProps {
  onScrollTo: (id: string) => void
  onOpenBlogPost: (post: BlogPost) => void
}

export function HeroSection({ onScrollTo, onOpenBlogPost }: HeroSectionProps) {
  return (
    <section id="hero" className="scroll-section flex items-center justify-center px-6 md:px-12 lg:px-24 py-16">
      <SectionRevealLayer className="max-w-6xl w-full">
        <RevealGroup className="hero-layout grid grid-cols-1 lg:grid-cols-[1fr_minmax(260px,300px)] gap-8 lg:gap-10 items-center">
        <div className="text-left space-y-6">
          <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-800/30 text-xs font-mono text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spezialisierung Datenanalyse im Endspurt – Bereit für neue Herausforderungen</span>
          </div>

          <h1 className="hero-title text-3xl md:text-4xl xl:text-5xl font-black tracking-tight leading-tight">
            <span className="hero-subline block text-slate-400 text-base md:text-lg font-normal tracking-wide mb-2">
              Hi, ich bin Sven. Ich verbinde
            </span>
            <span className="heading-display bg-clip-text text-transparent">
              Design, Code und Daten zu messbarem Erfolg.
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-lg max-w-2xl leading-relaxed">
            Ich verknüpfe tiefgreifendes UX/UI-Verständnis und moderne Full-Stack-Entwicklung mit
            fortgeschrittener KI-Datenanalyse. Von der visuellen Ästhetik über die technische
            Software-Architektur bis hin zur datenbasierten Optimierung baue ich digitale Ökosysteme,
            die nicht nur gut aussehen, sondern performen.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="button"
              onClick={() => onScrollTo('expertise')}
              className="btn btn-primary bg-gradient-to-r from-cyan-500 to-violet-600 border-none text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-cyan-500/20"
            >
              Tech Stack & Core Skills
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <a
              href={RESUME_PDF_PATH}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-white gap-2"
            >
              <FileText className="w-4 h-4" />
              Lebenslauf (PDF)
            </a>
          </div>
        </div>

        <div className="w-full flex justify-center lg:justify-end">
          <BlogTeaserSlider
            onOpenPost={onOpenBlogPost}
            onScrollToBlog={() => onScrollTo('blog')}
          />
        </div>
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
