import { useT } from '@/lib/i18n'
import { detectTemplate, renderHeuristic, renderTemplate } from './chart-templates'

/**
 * Renders the agent's `chart_text` field as a real chart. Two paths:
 *
 *   1. `[template:<id>]` tag → dispatch to the registry in
 *      `./chart-templates.ts`. The agent picks the template; the registry
 *      owns the parser + renderer for each id (see TemplateId for the list).
 *
 *   2. No tag (legacy / fallback) → try the bar parser first, then the
 *      line parser. Anything neither one can read renders verbatim.
 */

interface Props {
  text: string
}

export function ChartFromText({ text }: Props) {
  const t = useT()
  const { id, bodyLines, explicitTitle } = detectTemplate(text)

  if (id) {
    const node = renderTemplate(id, bodyLines, { t, explicitTitle })
    if (node) return <>{node}</>
    // Tag matched but payload was unreadable — fall through to heuristic on
    // the body so we still try to show *something* instead of dumping ASCII.
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
