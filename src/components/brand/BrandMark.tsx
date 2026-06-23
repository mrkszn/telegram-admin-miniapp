import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * InsightFlow brand mark — the wordless wave glyph.
 *
 * Visual reference: docs/branding screenshot (sine wave in violet→cyan
 * gradient, no tile). Used as the icon-only mark in the auth gate and any
 * other branded splash that already carries the wordmark in copy.
 *
 * Renders as inline SVG with `currentColor`-independent gradient strokes;
 * the wave reads on both light and dark surfaces. `radius` is kept on the
 * prop signature for backward compat with callers that previously rendered
 * a rounded tile — it's a no-op in this glyph-only form.
 */
export interface BrandMarkProps {
  /** Pixel size of the bounding box. Default 32. */
  size?: number
  /** Deprecated: tile radius (the legacy "italic-i tile" form). Ignored
   *  by the new glyph mark but kept so existing callsites don't break. */
  radius?: number
  className?: string
  /** Pass a string when the mark stands alone (no adjacent wordmark). */
  ariaLabel?: string
}

export function BrandMark({ size = 32, className, ariaLabel }: BrandMarkProps) {
  // useId so multiple marks on the same page get unique gradient ids and
  // don't trample each other when one is unmounted (Safari quirk: shared
  // <linearGradient> ids stop painting once any referencer drops).
  const gradId = `bm-grad-${useId().replace(/:/g, '')}`
  const decorative = ariaLabel == null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 20"
      fill="none"
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={ariaLabel}
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="55%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {/* Two-cycle sine: up-peak near (8,3) → cross at (16,10) → down-trough
          near (24,17) → end at (30,10). Stroke width tuned so the glyph
          reads at 24-64 px without disappearing. */}
      <path
        d="M 2 10 C 5 3, 11 3, 16 10 S 27 17, 30 10"
        stroke={`url(#${gradId})`}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
