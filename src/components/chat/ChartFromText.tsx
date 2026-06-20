import { lazy, Suspense } from 'react'

/**
 * Thin wrapper around `ChartFromTextImpl`. The impl pulls in the chart
 * template registry → Tremor → Recharts (~840 kB minified). The /ask
 * route is loaded as soon as the user opens the chat tab, but most
 * sessions never receive a `chart_text`, so we lazy-load the chart bundle
 * and only pay the cost on the first agent reply that actually has one.
 *
 * Re-imports of `ChartFromText` are cheap (this file stays Tremor-free).
 * Once the chunk has loaded the import promise resolves synchronously, so
 * subsequent chart renders skip the placeholder.
 */

const ChartFromTextImpl = lazy(() => import('./ChartFromTextImpl'))

interface Props {
  text: string
}

export function ChartFromText({ text }: Props) {
  return (
    <Suspense fallback={<ChartPlaceholder />}>
      <ChartFromTextImpl text={text} />
    </Suspense>
  )
}

/** Neutral pulse while the chart chunk is in flight — same visual weight
 *  as a small chart card so the bubble layout doesn't jump. */
function ChartPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Chart loading"
      className="h-44 animate-pulse rounded-tag bg-surface-2"
    />
  )
}
