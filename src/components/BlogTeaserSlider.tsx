import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatBlogDate, getLatestBlogPosts, getNewestBlogPost } from '../data/blogPosts'
import type { BlogPost } from '../types/blog'
import { PortfolioCard } from './PortfolioCard'

const SLIDE_INTERVAL_MS = 5000

interface BlogTeaserSliderProps {
  onOpenPost: (post: BlogPost) => void
  onScrollToBlog: () => void
}

export function BlogTeaserSlider({ onOpenPost, onScrollToBlog }: BlogTeaserSliderProps) {
  const slides = getLatestBlogPosts(3)
  const newest = getNewestBlogPost()
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return
      setActiveIndex(((index % slides.length) + slides.length) % slides.length)
    },
    [slides.length],
  )

  useEffect(() => {
    if (slides.length <= 1 || paused) return
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length)
    }, SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [slides.length, paused])

  if (slides.length === 0 || !newest) {
    return (
      <PortfolioCard glow="card-glow--violet-cyan card-glow--compact" hover="violet" className="blog-teaser-box w-full max-w-sm">
        <p className="text-xs text-slate-400">Blog-Beiträge in src/data/blogPosts.ts anlegen.</p>
      </PortfolioCard>
    )
  }

  const post = slides[activeIndex]

  return (
    <PortfolioCard glow="card-glow--violet-cyan card-glow--compact" hover="violet" className="blog-teaser-box w-full max-w-sm">
      <div
        className="flex flex-col gap-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-violet-400 uppercase tracking-widest">
            <BookOpen className="w-3.5 h-3.5" />
            Blog
          </span>
          <button
            type="button"
            onClick={() => onOpenPost(newest)}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 transition-colors shrink-0"
          >
            Neuester Beitrag
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <article className="blog-teaser-slider min-h-[7.5rem]">
          <button
            type="button"
            onClick={() => onOpenPost(post)}
            className="text-left group flex flex-col gap-1.5 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 rounded-lg"
          >
            <time className="text-[9px] font-mono text-slate-500">{formatBlogDate(post.date)}</time>
            <h3 className="heading-section text-sm font-bold leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">{post.teaser}</p>
            <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 mt-0.5">
              Weiterlesen
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </article>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Blog-Vorschau">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Beitrag ${index + 1}: ${slide.title}`}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? 'w-5 bg-cyan-400' : 'w-1.5 bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              aria-label="Vorheriger Beitrag"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
              aria-label="Nächster Beitrag"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onScrollToBlog}
          className="text-[10px] font-mono text-slate-500 hover:text-violet-400 text-center w-full pt-1 border-t border-slate-800 transition-colors"
        >
          Alle Beiträge anzeigen →
        </button>
      </div>
    </PortfolioCard>
  )
}
