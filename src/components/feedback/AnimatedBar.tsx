import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedBarProps {
  /** Target width as a percentage 0..100. */
  pct: number
  /** Tailwind colour class for the bar fill (e.g. `bg-success`). */
  className?: string
  /** Track / background class (defaults to surface-2). */
  trackClassName?: string
  /** Bar height in tailwind (default `h-2`). */
  heightClassName?: string
  /** Extra classes for the outer track wrapper (e.g. `flex-1 w-24`). */
  wrapperClassName?: string
  /** Animation duration in ms. */
  durationMs?: number
  /** Delay before the fill starts in ms (great for staggered lists). */
  delayMs?: number
  /** Optional aria-label. */
  label?: string
}

/**
 * Horizontal progress bar that animates its width from 0 to `pct` on
 * mount (and whenever `pct` changes). Used in:
 *   - /topics top-5 bars
 *   - /metrics enum-distribution category list
 *   - dashboard top topics list
 *   - clients deep-dive avg-sentiment readout
 *
 * Respects `prefers-reduced-motion`: viewers with that preference get
 * the bar at its final width on the first paint, no transition.
 */
export function AnimatedBar({
  pct,
  className = 'bg-brand',
  trackClassName = 'bg-surface-2',
  heightClassName = 'h-2',
  wrapperClassName,
  durationMs = 700,
  delayMs = 0,
  label,
}: AnimatedBarProps) {
  const [width, setWidth] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    // Skip animation for the prefers-reduced-motion crowd — jump straight
    // to the final value. Also skip in non-browser contexts (jsdom in
    // tests doesn't ship matchMedia or requestAnimationFrame reliably).
    const noMedia =
      typeof window === 'undefined' || typeof window.matchMedia !== 'function'
    if (noMedia) {
      setWidth(pct)
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setWidth(pct)
      return
    }
    // Start from 0 on the first render of THIS instance — RAF tick lets
    // the browser commit the 0-width frame before transitioning.
    if (!mounted.current) {
      setWidth(0)
      mounted.current = true
    }
    const raf = requestAnimationFrame(() => {
      setWidth(pct)
    })
    return () => cancelAnimationFrame(raf)
  }, [pct])

  return (
    <div
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'overflow-hidden rounded-full',
        heightClassName,
        trackClassName,
        wrapperClassName,
      )}
    >
      <div
        className={cn('h-full rounded-full', className)}
        style={{
          width: `${width}%`,
          transition: `width ${durationMs}ms cubic-bezier(0.2, 0, 0, 1) ${delayMs}ms`,
          willChange: 'width',
        }}
      />
    </div>
  )
}
