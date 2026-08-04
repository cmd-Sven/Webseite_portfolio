import { BlogCarousel } from '../components/BlogCarousel'
import { RevealGroup, SectionRevealLayer } from '../components/SectionReveal'
import { SectionHeader } from '../components/SectionHeader'
import type { BlogPost } from '../types/blog'

interface BlogSectionProps {
  onSelectPost: (post: BlogPost) => void
}

export function BlogSection({ onSelectPost }: BlogSectionProps) {
  return (
    <section
      id="blog"
      className="scroll-section section-shell scroll-section--blog flex items-center justify-center overflow-x-hidden"
    >
      <SectionRevealLayer className="max-w-6xl w-full flex flex-col gap-6 min-h-0">
        <RevealGroup className="flex flex-col gap-6">
          <SectionHeader
            eyebrow="Gedanken & Learnings"
            title="Blog"
            lead="Zwei Beiträge pro Slide – Klick auf eine Karte öffnet den vollständigen Artikel im Modal."
            accent="violet"
          />

          <BlogCarousel onSelectPost={onSelectPost} />
        </RevealGroup>
      </SectionRevealLayer>
    </section>
  )
}
