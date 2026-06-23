import { cn } from '@/lib/utils'

export type BrandMarkVariant = 'gradient' | 'mono' | 'outline'

interface BrandMarkProps {
  /** Tile edge length in px. Drives radius (~size * 0.25) and glyph size. */
  size?: number
  /** `gradient` = the full violet wash (default). `mono` = solid --ink for
   *  favicon-style mono renders. `outline` = subtle bordered tile for
   *  inverted brand contexts. */
  variant?: BrandMarkVariant
  className?: string
  /** Decorative by default — set a string when the mark stands alone. */
  ariaLabel?: string
}

/**
 * The InsightFlow brand mark: a rounded tile with a serif italic `i` glyph.
 * Sourced from design/iterations/insightflow/components.jsx → `BrandMark`.
 * Use in drawer header, chat-agent avatar, splash, favicon SVG.
 */
export function BrandMark({
  size = 32,
  variant = 'gradient',
  className,
  ariaLabel,
}: BrandMarkProps) {
  const radius = Math.round(size * 0.25)
  const glyphSize = Math.round(size * 0.66)
  const decorative = ariaLabel == null
  const variantClass =
    variant === 'gradient'
      ? 'bg-grad-brand text-white shadow-[0_4px_12px_-3px_color-mix(in_srgb,var(--primary)_55%,transparent)]'
      : variant === 'outline'
        ? 'border border-line bg-surface text-ink'
        : 'bg-ink text-bg'
  return (
    <span
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={ariaLabel}
      className={cn(
        'inline-grid shrink-0 place-items-center font-serif italic leading-none',
        variantClass,
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        fontSize: glyphSize,
      }}
    >
      i
    </span>
  )
}
