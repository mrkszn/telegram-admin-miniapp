import { useEffect, useRef, useState } from 'react'
import { numberLocale, useLanguage } from '@/lib/i18n'

interface CountUpProps {
  /** Target number. The component animates from 0 (or `from`) to this. */
  to: number
  /** Starting value (default 0). */
  from?: number
  /** Animation duration in ms (default 800). */
  durationMs?: number
  /** Delay before counting starts in ms. */
  delayMs?: number
  /** Number of fraction digits to display (default = inferred from `to`). */
  fractionDigits?: number
  /** Override the number locale (defaults to the active UI language). */
  locale?: string
  /** Optional prefix (e.g. `+` for positive deltas). */
  prefix?: string
  /** Optional suffix (e.g. `%`, `€`). */
  suffix?: string
  className?: string
}

const ease = (t: number) =>
  // cubic-bezier(0.2, 0, 0, 1) approx — smooth ease-out.
  1 - Math.pow(1 - t, 3)

function inferFractionDigits(n: number): number {
  if (Number.isInteger(n)) return 0
  const s = String(n)
  const dot = s.indexOf('.')
  return dot >= 0 ? Math.min(2, s.length - dot - 1) : 0
}

/**
 * Tabular-numbers tween from `from` → `to` over `durationMs`. Used wherever
 * a "number arriving" should feel like an arrival, not a pop:
 *   - KPI values on /dashboard
 *   - Topic counts on /topics
 *   - Client deep-dive metrics
 *   - Donut center total
 *
 * Respects `prefers-reduced-motion`: renders the final value immediately.
 *
 * Note: the component renders the FORMATTED final value in `aria-label`
 * so screen readers don't hear the intermediate tween.
 */
export function CountUp({
  to,
  from = 0,
  durationMs = 800,
  delayMs = 0,
  fractionDigits,
  locale,
  prefix,
  suffix,
  className,
}: CountUpProps) {
  const lang = useLanguage()
  const resolvedLocale = locale ?? numberLocale(lang)
  const digits = fractionDigits ?? inferFractionDigits(to)
  const [value, setValue] = useState<number>(() => {
    // Initialise at `from` so the very first paint isn't already the
    // target. The useEffect below tweens us there.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return to
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return reduced ? to : from
  })
  const fromRef = useRef(from)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setValue(to)
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setValue(to)
      return
    }
    let raf = 0
    let start = 0
    const startValue = fromRef.current
    const tick = (now: number) => {
      if (!start) start = now
      const elapsed = now - start - delayMs
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, elapsed / durationMs)
      const v = startValue + (to - startValue) * ease(t)
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
      else {
        // Lock the final value so we end up showing the exact `to`,
        // not a rounding artefact like 29.999.
        setValue(to)
        // Save the just-reached value so re-renders with the same `to`
        // don't re-animate from 0.
        fromRef.current = to
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, durationMs, delayMs])

  const formatted = value.toLocaleString(resolvedLocale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
  const finalFormatted = to.toLocaleString(resolvedLocale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

  return (
    <span
      aria-label={`${prefix ?? ''}${finalFormatted}${suffix ?? ''}`}
      className={className}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
