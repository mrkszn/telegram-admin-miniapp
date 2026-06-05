/**
 * Static fallback list of metric_key values surfaced in the picker.
 *
 * Source of truth: `templates/tg-restaurant/question_seed.json` in the
 * telegram-waiter backend repo. Whenever the seed grows, mirror it here.
 *
 * NB: the previous list (rating / satisfaction / service_quality / …) was
 * stale and produced 404 from `/admin/metrics` for every value — that's
 * what the "Не удалось загрузить данные" error on the Metrics screen was.
 */
export interface MetricKeyOption {
  value: string
  label: string
}

export const METRIC_KEYS: MetricKeyOption[] = [
  { value: 'nps', label: 'NPS' },
  { value: 'service_speed', label: 'Скорость сервиса' },
  { value: 'food_taste', label: 'Вкус блюд' },
  { value: 'cleanliness', label: 'Чистота' },
  { value: 'price_value', label: 'Соотношение цена/качество' },
  { value: 'staff_friendliness', label: 'Дружелюбие персонала' },
  { value: 'improvement_wish', label: 'Пожелания' },
]

export const DEFAULT_METRIC_KEY = METRIC_KEYS[0]!.value

export function labelFor(key: string): string {
  return METRIC_KEYS.find((m) => m.value === key)?.label ?? key
}
