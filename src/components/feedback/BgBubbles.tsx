import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * Editorial bubble field for the chat empty state and the bootstrap splash.
 * Six oversized blurred orbs in the brand violet/indigo wash float across
 * the hero, layered above the radial `--grad-hero` background.
 *
 * Toggle via the `visible` prop instead of mounting / unmounting from the
 * caller — that keeps `useMemo` stable across visibility flips so the
 * scatter doesn't re-randomise (and the rise animation doesn't re-play)
 * every time the chat clears or the busy flag toggles.
 *
 * `aria-hidden` so screen readers skip them entirely. Honors
 * `prefers-reduced-motion`: the bubbles still render but stay still (no
 * `bubble-rise` entry animation — set in globals.css).
 *
 * Caller is responsible for establishing a positioned stacking context on
 * the parent (`relative isolate` is the canonical pairing); without
 * `isolate` the `-z-10` would escape upward and the layer would paint
 * below the page background.
 */

interface Bubble {
  id: number
  left: number
  top: number
  size: number
  hue: 'primary' | 'accent' | 'deep'
  delayMs: number
  opacity: number
}

const BUBBLES = 6
const HUES = ['primary', 'accent', 'deep'] as const

function makeBubbles(): Bubble[] {
  return Array.from({ length: BUBBLES }, (_, i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    top: 5 + Math.random() * 75,
    size: 140 + Math.random() * 180,
    hue: HUES[i % HUES.length]!,
    delayMs: i * 90,
    opacity: 0.18 + Math.random() * 0.18,
  }))
}

const HUE_VAR: Record<Bubble['hue'], string> = {
  primary: 'var(--primary)',
  accent: 'var(--accent)',
  deep: 'var(--primary-deep)',
}

interface BgBubblesProps {
  /** When false, the layer fades out via opacity (no unmount → no
   *  re-randomise on the next show). Defaults to true. */
  visible?: boolean
  className?: string
}

export function BgBubbles({ visible = true, className }: BgBubblesProps) {
  const bubbles = useMemo(makeBubbles, [])
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-grad-hero transition-opacity duration-500',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="bg-bubble animate-bubble-rise absolute rounded-full"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: b.size,
            height: b.size,
            background: HUE_VAR[b.hue],
            opacity: b.opacity,
            filter: 'blur(60px)',
            animationDelay: `${b.delayMs}ms`,
          }}
        />
      ))}
    </div>
  )
}
