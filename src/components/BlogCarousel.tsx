import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useViewport } from '../context/ViewportContext'
import { getBlogPostSlides, getSortedBlogPosts } from '../data/blogPosts'
import type { BlogPost } from '../types/blog'
import { BlogPostTile } from './BlogPostTile'
import { PortfolioCard } from './PortfolioCard'

const AUTO_ADVANCE_MS = 8000

interface BlogCarouselProps {
  onSelectPost: (post: BlogPost) => void
}

export function BlogCarousel({ onSelectPost }: BlogCarouselProps) {
  const { viewport } = useViewport()
  const posts = getSortedBlogPosts()
  const perSlide = viewport === 'mobile' ? 1 : 2
  const slides = getBlogPostSlides(posts, perSlide)
  const [activeSlide, setActiveSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return
      setActiveSlide(((index % slides.length) + slides.length) % slides.length)
    },
    [slides.length],
  )

  useEffect(() => {
    setActiveSlide(0)
  }, [slides.length, perSlide])

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    const timer = window.setInterval(() => {
      setActiveSlide((i) => (i + 1) % slides.length)
    }, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [slides.length, paused])

  if (posts.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Noch keine Beiträge – füge Einträge in{' '}
        <code className="text-cyan-400">src/data/blogPosts.ts</code> hinzu.
      </p>
    )
  }

  return (
    <PortfolioCard
      glow="card-glow--violet-fuchsia card-glow--slow"
      hover="violet"
      className="blog-carousel !p-0 overflow-hidden"
    >
      <div
        className="blog-carousel__inner relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="blog-carousel__viewport overflow-hidden">
          <div
            className="blog-carousel__track flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {slides.map((slidePosts, slideIndex) => (
              <div
                key={slideIndex}
                className="blog-carousel__slide w-full shrink-0 p-4 sm:p-6 md:p-7"
                aria-hidden={slideIndex !== activeSlide}
              >
                <div
                  className={`blog-carousel-slide-grid grid gap-4 sm:gap-5 h-full grid-cols-1 md:grid-cols-2 ${
                    slidePosts.length === 1 ? 'blog-carousel-slide-grid--single max-w-xl mx-auto' : ''
                  }`}
                >
                  {slidePosts.map((post) => (
                    <BlogPostTile key={post.id} post={post} onSelect={onSelectPost} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeSlide - 1)}
              className="blog-carousel__nav blog-carousel__nav--prev absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-slate-700 bg-slate-950/90 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors shadow-lg"
              aria-label="Vorherige Beiträge"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeSlide + 1)}
              className="blog-carousel__nav blog-carousel__nav--next absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-slate-700 bg-slate-950/90 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors shadow-lg"
              aria-label="Nächste Beiträge"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-t border-slate-800/80 bg-[#090a0f]/60">
          <p className="text-[10px] font-mono text-slate-500">
            Slide {activeSlide + 1} / {slides.length}
            <span className="hidden sm:inline text-slate-600"> · 2 Beiträge pro Ansicht</span>
          </p>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Blog-Slider">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === activeSlide}
                aria-label={`Slide ${index + 1}`}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeSlide ? 'w-6 bg-violet-400' : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </PortfolioCard>
  )
}
