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
import { translate, type Language, type TranslationKey } from './i18n'

export interface MetricKeyOption {
  value: string
  label: string
}

interface MetricKeySeed {
  value: string
  labelKey: TranslationKey
}

// `labelKey` resolves through the i18n catalogue so the picker follows the
// language toggle while the live /admin/questions list is in flight.
const METRIC_KEY_SEEDS: MetricKeySeed[] = [
  { value: 'nps', labelKey: 'metricKey.nps' },
  { value: 'service_speed', labelKey: 'metricKey.service_speed' },
  { value: 'food_taste', labelKey: 'metricKey.food_taste' },
  { value: 'cleanliness', labelKey: 'metricKey.cleanliness' },
  { value: 'price_value', labelKey: 'metricKey.price_value' },
  { value: 'staff_friendliness', labelKey: 'metricKey.staff_friendliness' },
  { value: 'improvement_wish', labelKey: 'metricKey.improvement_wish' },
]

export function metricKeyOptions(lang: Language): MetricKeyOption[] {
  return METRIC_KEY_SEEDS.map((seed) => ({
    value: seed.value,
    label: translate(lang, seed.labelKey),
  }))
}

export const DEFAULT_METRIC_KEY = METRIC_KEY_SEEDS[0]!.value

export function staticLabelFor(key: string, lang: Language): string {
  const seed = METRIC_KEY_SEEDS.find((m) => m.value === key)
  return seed ? translate(lang, seed.labelKey) : key
}
