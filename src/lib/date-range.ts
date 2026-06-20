/**
 * Date-range presets + custom range shared across /dashboard, /metrics,
 * /topics. Persisted via `usePersistentState` so the picked period survives
 * navigation, tab switches, and Mini App restarts.
 *
 * Backend (telegram-waiter Phase 4A) expects ISO-8601 UTC with Z suffix.
 * We resolve presets against `now` at call time so cache keys are
 * deterministic per render.
 */

import type { Language, TranslationKey, Translator } from '@/lib/i18n'
import { dateLocale } from '@/lib/i18n'

export type DateRangePreset = '7d' | '30d' | '90d'

export const DEFAULT_PRESET: DateRangePreset = '7d'

export function isDateRangePreset(v: unknown): v is DateRangePreset {
  return v === '7d' || v === '30d' || v === '90d'
}

/**
 * What the user picked. Either one of the preset windows (resolved against
 * "now" at render time) or a fixed custom window with explicit ISO bounds.
 */
export type DateRangeSelection =
  | { kind: 'preset'; preset: DateRangePreset }
  | { kind: 'custom'; date_from: string; date_to: string }

export const DEFAULT_SELECTION: DateRangeSelection = {
  kind: 'preset',
  preset: DEFAULT_PRESET,
}

export function isDateRangeSelection(v: unknown): v is DateRangeSelection {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  if (o.kind === 'preset') return isDateRangePreset(o.preset)
  if (o.kind === 'custom')
    return typeof o.date_from === 'string' && typeof o.date_to === 'string'
  return false
}

export const PRESET_LABEL_KEYS: Record<DateRangePreset, TranslationKey> = {
  '7d': 'dateRange.7d',
  '30d': 'dateRange.30d',
  '90d': 'dateRange.90d',
}

export interface ResolvedRange {
  date_from: string
  date_to: string
}

const DAY_MS = 24 * 60 * 60 * 1000

const PRESET_DAYS: Record<DateRangePreset, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

/** Preset → ISO range ending `now`. */
export function resolveRange(preset: DateRangePreset, now: Date = new Date()): ResolvedRange {
  const days = PRESET_DAYS[preset]
  const from = new Date(now.getTime() - days * DAY_MS)
  return { date_from: from.toISOString(), date_to: now.toISOString() }
}

/** Resolve any selection (preset OR custom) to a concrete ISO range. */
export function resolveSelection(
  selection: DateRangeSelection,
  now: Date = new Date(),
): ResolvedRange {
  if (selection.kind === 'custom') {
    return { date_from: selection.date_from, date_to: selection.date_to }
  }
  return resolveRange(selection.preset, now)
}

/**
 * Human-readable label for prompts and headings — "7 днів" for preset,
 * "15.05 – 30.05" (locale-aware) for custom.
 */
export function formatRangeLabel(
  selection: DateRangeSelection,
  t: Translator,
  lang: Language,
): string {
  if (selection.kind === 'preset') {
    return t(PRESET_LABEL_KEYS[selection.preset])
  }
  const fmt = new Intl.DateTimeFormat(dateLocale(lang), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${fmt.format(new Date(selection.date_from))} — ${fmt.format(new Date(selection.date_to))}`
}

/** YYYY-MM-DD slice from an ISO string (or "" if invalid). */
export function isoToDateInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/** Wrap a `<input type="date">` value (YYYY-MM-DD) into the ISO bounds. */
export function dateInputToIso(value: string, endOfDay: boolean): string {
  const time = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'
  return `${value}${time}`
}
