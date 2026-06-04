/**
 * Date-range presets shared across /dashboard, /metrics, /topics.
 *
 * Backend (telegram-waiter Phase 4A) expects ISO-8601 UTC with Z suffix.
 * We resolve the range against `now` at call time so cache keys are
 * deterministic per render.
 */

export type DateRangePreset = '7d' | '30d' | '90d'

export const DEFAULT_PRESET: DateRangePreset = '7d'

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  '7d': '7 дней',
  '30d': '30 дней',
  '90d': '90 дней',
}

export interface ResolvedRange {
  preset: DateRangePreset
  date_from: string
  date_to: string
}

const DAY_MS = 24 * 60 * 60 * 1000

const PRESET_DAYS: Record<DateRangePreset, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

/**
 * Resolve a preset to an ISO range ending `now`.
 * `now` is injected for testability — defaults to `new Date()`.
 */
export function resolveRange(preset: DateRangePreset, now: Date = new Date()): ResolvedRange {
  const days = PRESET_DAYS[preset]
  const from = new Date(now.getTime() - days * DAY_MS)
  return {
    preset,
    date_from: from.toISOString(),
    date_to: now.toISOString(),
  }
}
