import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatBlogDate,
  getBlogCoverImage,
  getLatestBlogPosts,
  getNewestBlogPost,
} from '../data/blogPosts'
import type { BlogPost } from '../types/blog'
import { PortfolioCard } from './PortfolioCard'

const SLIDE_INTERVAL_MS = 5000

interface BlogTeaserSliderProps {
  onOpenPost: (post: BlogPost) => void
  onScrollToBlog: () => void
  /** `hero`: eingebettet im Hero-Banner, ohne eigene Glow-Card */
  variant?: 'default' | 'hero'
}

export function BlogTeaserSlider({
  onOpenPost,
  onScrollToBlog,
  variant = 'default',
}: BlogTeaserSliderProps) {
  const slides = getLatestBlogPosts(3)
  const newest = getNewestBlogPost()
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const isHero = variant === 'hero'

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

  const emptyMessage = (
    <p className="text-xs text-slate-400">Blog-Beiträge in src/data/blogPosts.ts anlegen.</p>
  )

  if (slides.length === 0 || !newest) {
    if (isHero) {
      return <div className="blog-teaser-box blog-teaser-box--hero w-full">{emptyMessage}</div>
    }
    return (
      <PortfolioCard
        glow="card-glow--violet-cyan card-glow--compact"
        hover="violet"
        className="blog-teaser-box w-full max-w-sm"
      >
        {emptyMessage}
      </PortfolioCard>
    )
  }

  const post = slides[activeIndex]

  const content = (
    <div
      className="flex flex-col gap-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={`flex items-center justify-between gap-2 pb-2 ${
          isHero ? 'border-b border-slate-800/80' : 'border-b border-slate-800'
        }`}
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-violet-400">
          <BookOpen className="h-3.5 w-3.5" />
          Blog
        </span>
        <button
          type="button"
          onClick={() => onOpenPost(newest)}
          className="flex shrink-0 items-center gap-0.5 text-[10px] font-mono text-cyan-400 transition-colors hover:text-cyan-300"
        >
          Neuester Beitrag
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <article className={`blog-teaser-slider ${isHero ? 'min-h-0' : 'min-h-[7.5rem]'}`}>
        <button
          type="button"
          onClick={() => onOpenPost(post)}
          className="group flex w-full flex-col gap-1.5 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
        >
          {isHero && (
            <div className="relative mb-1 aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900">
              <img
                src={getBlogCoverImage(post)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/80 to-transparent" />
            </div>
          )}
          <time className="font-mono text-[9px] text-slate-500">{formatBlogDate(post.date)}</time>
          <h3
            className={`heading-section font-bold leading-snug transition-colors group-hover:text-cyan-400 line-clamp-2 ${
              isHero ? 'text-base md:text-lg' : 'text-sm'
            }`}
          >
            {post.title}
          </h3>
          <p
            className={`leading-relaxed text-slate-400 ${
              isHero ? 'text-xs md:text-[13px] line-clamp-2' : 'text-[11px] line-clamp-3'
            }`}
          >
            {post.teaser}
          </p>
          <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-cyan-400">
            Weiterlesen
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
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
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
            aria-label="Vorheriger Beitrag"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
            aria-label="Nächster Beitrag"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onScrollToBlog}
        className={`w-full pt-1 text-center font-mono text-[10px] text-slate-500 transition-colors hover:text-violet-400 ${
          isHero ? 'border-t border-slate-800/80' : 'border-t border-slate-800'
        }`}
      >
        Alle Beiträge anzeigen →
      </button>
    </div>
  )

  if (isHero) {
    return <div className="blog-teaser-box blog-teaser-box--hero w-full">{content}</div>
  }

  return (
    <PortfolioCard
      glow="card-glow--violet-cyan card-glow--compact"
      hover="violet"
      className="blog-teaser-box w-full max-w-sm"
    >
      {content}
    </PortfolioCard>
  )
}
