import { useMemo } from 'react'

/**
 * Subtle background particle field. 18 tiny dots in brand cyan + violet
 * drifting slowly across the viewport with staggered animations. Sits
 * behind everything (z-index -10, pointer-events none) so it never
 * intercepts taps. Density and motion duration tuned for the InsightFlow
 * vibe — atmospheric but never distracting from data.
 *
 * Particles are deterministic per mount (we lock the random seed via
 * useMemo without args = stable across re-renders inside a session, but
 * different each cold start so it never feels canned).
 */

interface Particle {
  id: number
  left: number // % across viewport
  top: number // % down viewport
  size: number // px
  duration: number // s
  delay: number // s
  hue: 'brand' | 'accent'
  drift: number // px translate envelope
}

const COUNT = 18

function makeParticles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 3 + Math.random() * 6, // 3-9 px
    duration: 12 + Math.random() * 16, // 12-28 s
    delay: -Math.random() * 20, // negative → mid-cycle on mount
    hue: Math.random() > 0.5 ? 'brand' : 'accent',
    drift: 30 + Math.random() * 50,
  }))
}

export function BgParticles() {
  const particles = useMemo(makeParticles, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="bg-particle absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background:
              p.hue === 'brand'
                ? 'var(--primary)'
                : 'var(--accent)',
            opacity: 0.25,
            filter: 'blur(1px)',
            ['--p-drift' as string]: `${p.drift}px`,
            ['--p-duration' as string]: `${p.duration}s`,
            ['--p-delay' as string]: `${p.delay}s`,
            animationName: 'bg-particle-drift',
            animationDuration: `var(--p-duration)`,
            animationDelay: `var(--p-delay)`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
            animationDirection: 'alternate',
          }}
        />
      ))}
    </div>
  )
}
