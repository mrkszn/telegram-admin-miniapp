import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      // surface-2 base + brand shimmer sweep on top (see globals.css).
      className={cn(
        'animate-shimmer rounded-tag bg-surface-2 bg-no-repeat',
        className,
      )}
    />
  )
}
