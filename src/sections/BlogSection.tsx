import { BlogCarousel } from '../components/BlogCarousel'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import type { BlogPost } from '../types/blog'

interface BlogSectionProps {
  onSelectPost: (post: BlogPost) => void
}

export function BlogSection({ onSelectPost }: BlogSectionProps) {
  return (
    <section
      id="blog"
      className="scroll-section scroll-section--blog flex items-center justify-center px-6 md:px-12 py-16 overflow-x-hidden"
    >
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col space-y-5 min-h-0">
        <RevealGroup className="flex flex-col space-y-5">
        <div className="shrink-0">
          <span className="text-xs font-mono text-violet-400 uppercase tracking-widest">
            Gedanken & Learnings
          </span>
          <h2 className="heading-section section-heading-xl text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
            Blog
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Zwei Beiträge pro Slide – Klick auf eine Karte öffnet den vollständigen Artikel im Modal.
          </p>
        </div>

        <BlogCarousel onSelectPost={onSelectPost} />
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
