import { cn } from '@/lib/utils'

interface ClientAvatarProps {
  /** Display name; first two word initials are used. */
  name?: string | null
  /** Falls back to last two digits of the telegram id if name is empty. */
  telegramId: number | null
  size?: number
  tone?: 'positive' | 'negative' | 'neutral' | 'brand'
  className?: string
}

const toneBg: Record<NonNullable<ClientAvatarProps['tone']>, string> = {
  positive: 'bg-mint/25 text-success',
  negative: 'bg-rose/25 text-danger',
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand-deep',
}

export function ClientAvatar({
  name,
  telegramId,
  size = 40,
  tone = 'brand',
  className,
}: ClientAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold',
        toneBg[tone],
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.35) }}
    >
      {initialsOf(name, telegramId)}
    </span>
  )
}

function initialsOf(name: string | null | undefined, telegramId: number | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/).slice(0, 2)
    const letters = parts
      .map((p) => p[0] ?? '')
      .filter(Boolean)
      .join('')
      .toUpperCase()
    if (letters) return letters
  }
  if (telegramId != null) return String(telegramId).slice(0, 2)
  return '—'
}
