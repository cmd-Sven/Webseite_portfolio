const LOGO_FULL = '/logo-sieber.webp?v=3'
const LOGO_MARK = '/logo-sieber-mark.webp?v=3'

type BrandLogoVariant = 'full' | 'mark'
type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/** Full lockup sizes ≈ 2× previous display so name/tagline stay readable. */
const FULL_SIZE: Record<BrandLogoSize, string> = {
  sm: 'h-16 max-w-[min(100%,20rem)]',
  md: 'h-20 md:h-[5.5rem] max-w-[min(100%,28rem)] sm:max-w-[32rem]',
  lg: 'h-24 md:h-28 max-w-[min(100%,36rem)]',
  xl: 'h-28 md:h-32 max-w-[min(100%,40rem)]',
  '2xl': 'h-32 md:h-40 max-w-[min(100%,48rem)]',
}

const MARK_SIZE: Record<BrandLogoSize, string> = {
  sm: 'h-8 w-auto max-w-[2.75rem]',
  md: 'h-10 w-auto max-w-[3.25rem]',
  lg: 'h-12 w-auto max-w-[4rem]',
  xl: 'h-16 w-auto max-w-[4.5rem]',
  /** Fixed header: 2× previous header mark (`md` / h-10). */
  '2xl': 'h-20 w-auto max-w-[6.5rem]',
}

interface BrandLogoProps {
  variant?: BrandLogoVariant
  size?: BrandLogoSize
  className?: string
}

/** Full lockup or mark-only; assets already have alpha — no plate background. */
export function BrandLogo({
  variant = 'mark',
  size = 'md',
  className = '',
}: BrandLogoProps) {
  const isMark = variant === 'mark'
  const src = isMark ? LOGO_MARK : LOGO_FULL
  const sizeClass = isMark ? MARK_SIZE[size] : FULL_SIZE[size]
  const objectPos = isMark ? 'object-center' : 'object-left'

  return (
    <img
      src={src}
      alt={
        isMark
          ? 'Sven Sieber'
          : 'Sven Sieber – Data & Frontend Engineering · UX/UI Design'
      }
      width={800}
      height={isMark ? 568 : 540}
      decoding="async"
      className={`brand-logo ${sizeClass} object-contain ${objectPos} ${className}`.trim()}
    />
  )
}
