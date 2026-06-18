import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-tag border px-2 py-0.5 text-xs font-medium tabular-nums transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand text-brand-on',
        soft: 'border-transparent bg-brand-soft text-brand-on-soft',
        secondary: 'border-transparent bg-surface-2 text-ink',
        outline: 'border-line bg-transparent text-ink',
        success: 'border-transparent bg-mint/15 text-success',
        warning: 'border-transparent bg-amber/15 text-warning',
        danger: 'border-transparent bg-rose/15 text-danger',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
