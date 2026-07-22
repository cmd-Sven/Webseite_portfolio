import { ArrowRight, Clock } from 'lucide-react'
import { BLOG_COVER_PLACEHOLDER, formatBlogDate, getBlogCoverImage } from '../data/blogPosts'
import type { BlogPost } from '../types/blog'
import { PORTFOLIO_CARD_SM } from '../lib/portfolioCard'

interface BlogPostTileProps {
  post: BlogPost
  onSelect: (post: BlogPost) => void
  className?: string
}

export function BlogPostTile({ post, onSelect, className = '' }: BlogPostTileProps) {
  const coverSrc = getBlogCoverImage(post)
  const isPlaceholder = coverSrc === BLOG_COVER_PLACEHOLDER

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(post)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(post)}
      className={`blog-post-tile group flex flex-col h-full min-h-0 rounded-xl border border-slate-800/80 bg-[#0c0d12] overflow-hidden cursor-pointer transition-colors hover:border-cyan-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${className}`}
    >
      <div className="relative h-40 sm:h-44 shrink-0 overflow-hidden bg-slate-900">
        <img
          src={coverSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0c0d12]/90 to-transparent pointer-events-none" />
        {isPlaceholder && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 text-[9px] font-mono text-slate-400 border border-slate-700/80">
            Platzhalter
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-5 gap-2 min-h-0">
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
          <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
          {post.readMinutes != null && (
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-violet-400" />
              {post.readMinutes} Min.
            </span>
          )}
        </div>

        <h3 className="heading-section text-base sm:text-lg font-bold leading-snug line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {post.title}
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 flex-1">{post.teaser}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={`${PORTFOLIO_CARD_SM} inline-block px-2 py-0.5 text-slate-400 text-[9px] font-mono`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 mt-auto pt-2 group-hover:translate-x-0.5 transition-transform">
          Beitrag lesen
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </article>
  )
}
