import { Calendar, Clock, Tag } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { formatBlogDate, getBlogCoverImage } from '../data/blogPosts'
import type { BlogPost } from '../types/blog'
import { BlogTermHint } from './BlogTermHint'
import { DesignTokensDemo } from './DesignTokensDemo'
import { PortfolioCard } from './PortfolioCard'

interface BlogPostModalProps {
  post: BlogPost
  onClose: () => void
}

const THEME_DEMO_MARKER = '{{theme-demo}}'
const TERM_MARKER_RE = /\{\{term:([^}]+)\}\}/g
/** {{quote:Text}} – hervorgehobenes Zitat / Fazit-Zeile */
const QUOTE_MARKER_RE = /^\{\{quote:(.+)\}\}$/s
/**
 * {{monologue:Speaker|Zitat|Aside}}
 * Aside = sarkastischer Autor-Kommentar (Parenthese).
 */
const MONOLOGUE_MARKER_RE = /^\{\{monologue:([^|]+)\|([^|]+)\|([^}]+)\}\}$/s

function renderTerms(text: string, keyPrefix: string) {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const re = new RegExp(TERM_MARKER_RE.source, 'g')

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const termKey = match[1].trim()
    nodes.push(<BlogTermHint key={`${keyPrefix}-term-${match.index}`} termKey={termKey} />)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : text
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/)
    if (bold) {
      return (
        <strong key={i} className="font-semibold text-slate-100">
          {renderTerms(bold[1], `b${i}`)}
        </strong>
      )
    }
    return <Fragment key={i}>{renderTerms(part, `p${i}`)}</Fragment>
  })
}

function renderContentBlock(block: string, index: number) {
  const trimmed = block.trim()

  if (trimmed === THEME_DEMO_MARKER) {
    return <DesignTokensDemo key={index} />
  }

  const monologue = trimmed.match(MONOLOGUE_MARKER_RE)
  if (monologue) {
    const speaker = monologue[1].trim()
    const quote = monologue[2].trim()
    const aside = monologue[3].trim()
    return (
      <figure key={index} className="blog-monologue">
        <figcaption className="blog-monologue__speaker">{renderInline(speaker)}</figcaption>
        <blockquote className="blog-monologue__quote">
          <p>{renderInline(quote)}</p>
        </blockquote>
        <p className="blog-monologue__aside">{renderInline(aside)}</p>
      </figure>
    )
  }

  const quote = trimmed.match(QUOTE_MARKER_RE)
  if (quote) {
    return (
      <blockquote key={index} className="blog-quote">
        <p>{renderInline(quote[1].trim())}</p>
      </blockquote>
    )
  }

  const heading = trimmed.match(/^##\s+(.+)$/)
  if (heading) {
    return (
      <h3 key={index} className="heading-section text-base font-bold pt-1">
        {renderInline(heading[1])}
      </h3>
    )
  }
  return <p key={index}>{renderInline(trimmed)}</p>
}

export function BlogPostModal({ post, onClose }: BlogPostModalProps) {
  const blocks = post.content.split(/\n\n+/).filter(Boolean)
  const coverSrc = getBlogCoverImage(post)

  return (
    <div
      className="viewport-modal-overlay flex items-center justify-center p-4 md:p-10 backdrop-blur-xl bg-slate-950/80 animate-fadeIn pointer-events-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-modal-title"
    >
      <div onClick={(e) => e.stopPropagation()} className="max-w-2xl w-full">
        <PortfolioCard
          glow="card-glow--violet-cyan card-glow--slow"
          hover="violet"
          className="relative !rounded-3xl max-h-[85vh] overflow-y-auto !p-0 text-left scrollbar-thin"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors z-10"
            aria-label="Beitrag schließen"
          >
            ✕
          </button>

          <div className="relative h-48 sm:h-56 shrink-0 overflow-hidden rounded-t-3xl">
            <img
              src={coverSrc}
              alt=""
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#090a0f]/85 to-transparent pointer-events-none" />
          </div>

          <div className="p-6 md:p-8 space-y-5">
            <header className="border-b border-slate-800 pb-4 space-y-2">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  {formatBlogDate(post.date)}
                </span>
                {post.readMinutes != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-violet-400" />
                    {post.readMinutes} Min. Lesezeit
                  </span>
                )}
              </div>
              <h2 id="blog-modal-title" className="heading-section text-2xl md:text-3xl font-black tracking-tight">
                {post.title}
              </h2>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-[9px] font-mono text-slate-400"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              {blocks.map((block, index) => renderContentBlock(block, index))}
            </div>
          </div>
        </PortfolioCard>
      </div>
    </div>
  )
}
