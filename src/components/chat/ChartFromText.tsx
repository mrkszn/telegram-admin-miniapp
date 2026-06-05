import { BarChartCard } from '@/components/charts/BarChartCard'
import { LineChartCard } from '@/components/charts/LineChartCard'

/**
 * Renders the agent's `chart_text` field as a real Tremor chart when the
 * ASCII shape is recognisable; falls back to a styled monospace block
 * otherwise. The agent emits free-form ASCII bars per the prompt
 * `core/agent/analytics_agent/prompts.py:SYNTHESIZE_SYSTEM`, so we parse
 * defensively — anything we can't read we render verbatim.
 *
 * Recognised shapes:
 *   1) Bar distribution
 *      Title (free-form line, optional)
 *      label1   | ███ 12
 *      label2   |  █  4
 *   2) Trend / line chart
 *      Title (optional)
 *      2026-06-01: 4.3
 *      2026-06-02: 4.5
 *      ...  (≥3 numeric points)
 */

interface BarPoint {
  label: string
  value: number
}

interface ParsedChart {
  kind: 'bar' | 'line' | 'fallback'
  title?: string
  data: BarPoint[]
}

const BAR_RE = /^\s*(\S(?:[^|]*\S)?)\s*\|+\s*[█▌▍▎▏▒░\-#=*█ ]*\s*([\d.,]+)\s*$/
const LINE_RE = /^\s*([\S ][^:]*?):\s*([\d.,-]+)\s*$/

function parseNumber(raw: string): number | null {
  const norm = raw.replace(/\s/g, '').replace(',', '.')
  const n = Number(norm)
  return Number.isFinite(n) ? n : null
}

function parseChart(text: string): ParsedChart {
  const lines = text.split('\n').map((l) => l.trimEnd())
  const dataLines: BarPoint[] = []
  let kind: 'bar' | 'line' | null = null
  let title: string | undefined

  for (const line of lines) {
    if (!line.trim()) continue

    // Try bar pattern first — has `|` separator, very specific
    const barMatch = line.match(BAR_RE)
    if (barMatch) {
      const val = parseNumber(barMatch[2]!)
      if (val != null) {
        kind = 'bar'
        dataLines.push({ label: barMatch[1]!.trim(), value: val })
        continue
      }
    }

    // Then try line/trend pattern — `label: value`
    if (kind === null || kind === 'line') {
      const lineMatch = line.match(LINE_RE)
      if (lineMatch) {
        const val = parseNumber(lineMatch[2]!)
        if (val != null) {
          kind = 'line'
          dataLines.push({ label: lineMatch[1]!.trim(), value: val })
          continue
        }
      }
    }

    // Non-data line — first non-empty is treated as title (only one)
    if (!title) title = line.trim()
  }

  if (!kind || dataLines.length < 2) {
    return { kind: 'fallback', data: [] }
  }
  return { kind, title, data: dataLines }
}

interface Props {
  text: string
}

export function ChartFromText({ text }: Props) {
  const parsed = parseChart(text)

  if (parsed.kind === 'fallback') {
    return (
      <pre className="m-0 max-h-72 overflow-x-auto whitespace-pre-wrap break-words rounded-tag bg-surface-2 px-3 py-3 font-mono text-[12px] leading-[17px] text-ink-2">
        {text}
      </pre>
    )
  }

  // Tremor expects an array of objects with a known index key.
  const data = parsed.data.map((d) => ({ label: d.label, value: d.value }))

  if (parsed.kind === 'bar') {
    return (
      <BarChartCard
        title={parsed.title ?? 'Распределение'}
        data={data}
        index="label"
        categories={['value']}
        colors={['violet']}
        height={Math.min(220, 40 + data.length * 28)}
      />
    )
  }

  return (
    <LineChartCard
      title={parsed.title ?? 'Тренд'}
      data={data}
      index="label"
      categories={['value']}
      colors={['violet']}
      height={180}
    />
  )
}
