import { useT } from '@/lib/i18n'
import { detectTemplate, renderHeuristic, renderTemplate } from './chart-templates'

interface Props {
  text: string
}

/**
 * Heavy implementation of `chart_text` rendering — pulls in the template
 * registry and (transitively) Tremor + Recharts. Loaded on demand by the
 * `ChartFromText` wrapper via `React.lazy()`, so the /ask route's initial
 * bundle stays Tremor-free.
 *
 * Dispatch:
 *   1. `[template:<id>]` on the first line → render via registry.
 *   2. Tag present but payload unparseable → run heuristic on the body so
 *      we still try to show *something* instead of raw ASCII.
 *   3. No tag → heuristic on the full text (bar then line).
 *   4. Heuristic also fails → render verbatim &lt;pre&gt;.
 */
export default function ChartFromTextImpl({ text }: Props) {
  const t = useT()
  const { id, bodyLines, explicitTitle } = detectTemplate(text)

  if (id) {
    const node = renderTemplate(id, bodyLines, { t, explicitTitle })
    if (node) return <>{node}</>
    const heuristic = renderHeuristic(bodyLines.join('\n'), t)
    if (heuristic) return <>{heuristic}</>
  } else {
    const heuristic = renderHeuristic(text, t)
    if (heuristic) return <>{heuristic}</>
  }

  return (
    <pre className="m-0 max-h-72 overflow-x-auto whitespace-pre-wrap break-words rounded-tag bg-surface-2 px-3 py-3 font-mono text-[12px] leading-[17px] text-ink-2">
      {text}
    </pre>
  )
}
