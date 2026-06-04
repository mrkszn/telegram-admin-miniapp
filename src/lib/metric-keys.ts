/**
 * Static fallback list of metric_key values surfaced in the picker.
 *
 * The backend doesn't expose a metric directory yet (per
 * docs/HTTP_API.md), so we keep a small curated list matching the
 * canonical tg-restaurant question_seed. Adding a new metric is a
 * one-line change here.
 */
export interface MetricKeyOption {
  value: string
  label: string
}

export const METRIC_KEYS: MetricKeyOption[] = [
  { value: 'rating', label: 'Оценка' },
  { value: 'satisfaction', label: 'Удовлетворённость' },
  { value: 'service_quality', label: 'Качество сервиса' },
  { value: 'wait_time_minutes', label: 'Время ожидания' },
  { value: 'would_return', label: 'Готовность вернуться' },
]

export const DEFAULT_METRIC_KEY = METRIC_KEYS[0]!.value

export function labelFor(key: string): string {
  return METRIC_KEYS.find((m) => m.value === key)?.label ?? key
}
