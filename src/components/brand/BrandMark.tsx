import { cn } from '@/lib/utils'

/**
 * Brand mark: a gradient tile with an italic serif "i".
 *
 * Visual reference: design/iterations/insightflow/components.jsx (BrandMark).
 * Gradient is hardcoded to indigo here so the auth gate paints correctly
 * before the full InsightFlow design-token migration lands.
 */
export interface BrandMarkProps {
  /** Pixel size of the square. Default 32. */
  size?: number
  /** Border radius in px. Default 8. */
  radius?: number
  className?: string
}

export function BrandMark({ size = 32, radius = 8, className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-grid select-none place-items-center font-serif italic', className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 50%, #3730a3 100%)',
        color: '#fff',
        fontSize: Math.round(size * 0.62),
        lineHeight: 1,
        boxShadow: '0 4px 14px -4px rgba(79, 70, 229, 0.55)',
        flexShrink: 0,
      }}
    >
      i
    </span>
  )
}
