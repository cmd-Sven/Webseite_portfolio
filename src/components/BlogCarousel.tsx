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

        <div className="blog-carousel__controls">
          <p className="blog-carousel__status">
            Slide {activeSlide + 1} / {slides.length}
            <span className="blog-carousel__status-hint">
              {' '}
              · {perSlide === 1 ? '1 Beitrag' : '2 Beiträge'} pro Ansicht
            </span>
          </p>

          {slides.length > 1 && (
            <div className="blog-carousel__pager">
              <button
                type="button"
                onClick={() => goTo(activeSlide - 1)}
                className="blog-carousel__nav"
                aria-label="Vorherige Beiträge"
              >
                <ChevronLeft className="blog-carousel__nav-icon" aria-hidden />
              </button>

              <div className="blog-carousel__dots" role="tablist" aria-label="Blog-Slider">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    role="tab"
                    aria-selected={index === activeSlide}
                    aria-label={`Slide ${index + 1}`}
                    onClick={() => goTo(index)}
                    className={`blog-carousel__dot${
                      index === activeSlide ? ' blog-carousel__dot--active' : ''
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goTo(activeSlide + 1)}
                className="blog-carousel__nav"
                aria-label="Nächste Beiträge"
              >
                <ChevronRight className="blog-carousel__nav-icon" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </PortfolioCard>
  )
}
