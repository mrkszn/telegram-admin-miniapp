/**
 * Static fallback list of metric_key values surfaced in the picker.
 *
 * Source of truth: `templates/tg-restaurant/question_seed.json` in the
 * telegram-waiter backend repo. Whenever the seed grows, mirror it here.
 *
 * NB: the previous list (rating / satisfaction / service_quality / …) was
 * stale and produced 404 from `/admin/metrics` for every value — that's
 * what the "failed to load data" error on the Metrics screen was.
 */
export interface MetricKeyOption {
  value: string
  label: string
}

// Static fallback labels in Ukrainian (the default UI language). The live
// list from GET /admin/questions overrides these whenever it loads, so these
// only show on the very first paint or if that call fails.
export const METRIC_KEYS: MetricKeyOption[] = [
  { value: 'nps', label: 'NPS' },
  { value: 'service_speed', label: 'Швидкість сервісу' },
  { value: 'food_taste', label: 'Смак страв' },
  { value: 'cleanliness', label: 'Чистота' },
  { value: 'price_value', label: 'Співвідношення ціна/якість' },
  { value: 'staff_friendliness', label: 'Дружелюбність персоналу' },
  { value: 'improvement_wish', label: 'Побажання' },
]

export const DEFAULT_METRIC_KEY = METRIC_KEYS[0]!.value

export function labelFor(key: string): string {
  return METRIC_KEYS.find((m) => m.value === key)?.label ?? key
}
