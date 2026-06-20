import type { ReactNode } from 'react'
import { BarChartCard } from '@/components/charts/BarChartCard'
import { LineChartCard } from '@/components/charts/LineChartCard'
import { DonutChartCard } from '@/components/charts/DonutChartCard'
import type { ChartColor } from '@/components/charts/palette'
import type { Translator } from '@/lib/i18n'

/**
 * Catalogue of chart templates the analytics agent can request via the
 * `[template:<id>]` tag on the first line of `chart_text`. Each template
 * owns its own parser + renderer so the agent only needs to remember the
 * payload shape it picks.
 *
 * Payload conventions (one row per line, blank lines ignored):
 *   • bar.distribution / donut.share / bar.sentiment — `label | value`
 *   • bar.grouped                                    — `label | +pos -neg`
 *   • line.trend                                     — `label: value`
 *   • kpi.single                                     — first non-title line
 *                                                      is the number;
 *                                                      anything after is a
 *                                                      caption (one line).
 *
 * The first non-tag, non-data line is treated as the chart title. Anything
 * the chosen template can't parse falls back to a verbatim &lt;pre&gt; block.
 */

export type TemplateId =
  | 'bar.distribution'
  | 'bar.sentiment'
  | 'bar.grouped'
  | 'donut.share'
  | 'line.trend'
  | 'kpi.single'

const TEMPLATE_IDS: readonly TemplateId[] = [
  'bar.distribution',
  'bar.sentiment',
  'bar.grouped',
  'donut.share',
  'line.trend',
  'kpi.single',
] as const

const TEMPLATE_TAG_RE = /^\s*\[template:\s*([a-z]+(?:\.[a-z]+)*)\s*\]\s*$/i
const BAR_ROW_RE = /^\s*(.+?)\s*\|\s*(.+?)\s*$/
const LINE_ROW_RE = /^\s*(.+?)\s*:\s*([\d.,+-]+)\s*$/
// Spec: literal `+` and `-` are mandatory; numbers are non-negative.
const GROUPED_ROW_RE = /^\s*(.+?)\s*\|\s*\+\s*([\d.,]+)\s+-\s*([\d.,]+)\s*$/
const NUMBER_ONLY_RE = /^\s*([+-]?[\d.,]+(?:\s*%)?)\s*$/

interface Row {
  label: string
  value: number
}

interface GroupedRow {
  label: string
  positive: number
  negative: number
}

function parseNumber(raw: string): number | null {
  const norm = raw.replace(/\s/g, '').replace('%', '').replace(',', '.')
  const n = Number(norm)
  return Number.isFinite(n) ? n : null
}

function parseBarRows(lines: string[]): { rows: Row[]; title?: string } {
  const rows: Row[] = []
  let title: string | undefined
  for (const line of lines) {
    if (!line.trim()) continue
    const m = line.match(BAR_ROW_RE)
    if (m) {
      const v = parseNumber(m[2]!)
      if (v != null) {
        rows.push({ label: m[1]!.trim(), value: v })
        continue
      }
    }
    if (!title) title = line.trim()
  }
  return { rows, title }
}

function parseGroupedRows(lines: string[]): { rows: GroupedRow[]; title?: string } {
  const rows: GroupedRow[] = []
  let title: string | undefined
  for (const line of lines) {
    if (!line.trim()) continue
    const m = line.match(GROUPED_ROW_RE)
    if (m) {
      const pos = parseNumber(m[2]!)
      const neg = parseNumber(m[3]!)
      if (pos != null && neg != null) {
        rows.push({ label: m[1]!.trim(), positive: pos, negative: neg })
        continue
      }
    }
    if (!title) title = line.trim()
  }
  return { rows, title }
}

function parseLineRows(lines: string[]): { rows: Row[]; title?: string } {
  const rows: Row[] = []
  let title: string | undefined
  for (const line of lines) {
    if (!line.trim()) continue
    const m = line.match(LINE_ROW_RE)
    if (m) {
      const v = parseNumber(m[2]!)
      if (v != null) {
        rows.push({ label: m[1]!.trim(), value: v })
        continue
      }
    }
    if (!title) title = line.trim()
  }
  return { rows, title }
}

/* ── scaling helpers ───────────────────────────────────── */

/** Cap label characters so the y-axis gutter doesn't eat the chart width. */
const MAX_LABEL_CHARS = 22

/** Row-count caps (defense-in-depth; backend also enforces). */
const MAX_BAR_ROWS = 12
const MAX_DONUT_ROWS = 6
const MAX_LINE_POINTS = 60

function truncate(s: string, max = MAX_LABEL_CHARS): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/**
 * Per-row height shrinks as the list grows so the whole card stays within
 * the chat viewport: 1–5 rows → roomy, 6–8 → standard, 9+ → compact.
 * Below the floor the chart becomes unreadable, so we add a soft cap on the
 * total chart canvas and let internal scrolling take over past it.
 */
function verticalBarHeight(n: number): number {
  if (n <= 0) return 200
  const perRow = n <= 5 ? 48 : n <= 8 ? 40 : 32
  return clamp(64 + n * perRow, 200, 480)
}

/** Tremor's y-axis gutter; long labels need more, but never more than ~140 px. */
function yAxisWidthFor(rows: Row[] | GroupedRow[]): number {
  const longest = rows.reduce((m, r) => Math.max(m, r.label.length), 0)
  return clamp(Math.round(longest * 7.2) + 8, 56, 140)
}

/* ── tone detection (bar.sentiment) ────────────────────── */

const POSITIVE_HINTS = /^(pos|поз|позитив|positive|good|👍|✅)/i
const NEGATIVE_HINTS = /^(neg|нег|негатив|negative|bad|👎|❌)/i
const NEUTRAL_HINTS = /^(neu|нейтр|нейтрал|нейтрально|neutral|other|інші)/i

function toneColor(label: string): ChartColor {
  if (POSITIVE_HINTS.test(label)) return 'emerald'
  if (NEGATIVE_HINTS.test(label)) return 'pink'
  if (NEUTRAL_HINTS.test(label)) return 'sky'
  return 'violet'
}

/* ── templates ─────────────────────────────────────────── */

interface TemplateContext {
  t: Translator
  /** Explicit title from the tag-payload (overrides parsed title). */
  explicitTitle?: string
}

type Template = (lines: string[], ctx: TemplateContext) => ReactNode | null

const TEMPLATES: Record<TemplateId, Template> = {
  /** Plain single-series horizontal/vertical bars — what the original heuristic produced. */
  'bar.distribution': (lines, { t, explicitTitle }) => {
    const { rows, title } = parseBarRows(lines)
    if (rows.length < 2) return null
    const capped = rows.slice(0, MAX_BAR_ROWS)
    const truncated = capped.map((r) => ({ label: truncate(r.label), value: r.value }))
    return (
      <BarChartCard
        title={explicitTitle ?? title ?? t('chart.distribution')}
        data={truncated}
        index="label"
        categories={['value']}
        colors={['violet']}
        layout="vertical"
        yAxisWidth={yAxisWidthFor(truncated)}
        height={verticalBarHeight(truncated.length)}
      />
    )
  },

  /** Bars where each row is coloured by tone hint (positive/negative/neutral). */
  'bar.sentiment': (lines, { t, explicitTitle }) => {
    const { rows, title } = parseBarRows(lines)
    if (rows.length < 2) return null
    const capped = rows.slice(0, MAX_BAR_ROWS)
    // Tremor BarChart paints one colour per category, not per row, so we
    // expand each row into its own category and fill missing cells with 0.
    // That way each bar gets a distinct fill while still sharing the y-axis.
    const truncated = capped.map((r) => ({ ...r, label: truncate(r.label) }))
    const colours = truncated.map((r) => toneColor(r.label))
    const categories = truncated.map((_, i) => `v${i}`)
    const data = truncated.map((r, i) => {
      const row: Record<string, number | string> = { label: r.label }
      categories.forEach((c, j) => {
        row[c] = i === j ? r.value : 0
      })
      return row
    })
    return (
      <BarChartCard
        title={explicitTitle ?? title ?? t('chart.sentimentDistribution')}
        data={data}
        index="label"
        categories={categories}
        colors={colours}
        layout="vertical"
        yAxisWidth={yAxisWidthFor(truncated)}
        height={verticalBarHeight(truncated.length)}
        // Each row is its own category — turn off legend, the y-axis is enough.
        valueFormatter={(n) => (n === 0 ? '' : String(n))}
      />
    )
  },

  /** Two values per row (positive vs negative) side-by-side. */
  'bar.grouped': (lines, { t, explicitTitle }) => {
    const { rows, title } = parseGroupedRows(lines)
    if (rows.length < 1) return null
    const capped = rows.slice(0, MAX_BAR_ROWS)
    const truncated = capped.map((r) => ({
      label: truncate(r.label),
      positive: r.positive,
      negative: r.negative,
    }))
    return (
      <BarChartCard
        title={explicitTitle ?? title ?? t('chart.comparison')}
        data={truncated}
        index="label"
        categories={['positive', 'negative']}
        colors={['emerald', 'pink']}
        layout="vertical"
        yAxisWidth={yAxisWidthFor(truncated)}
        height={verticalBarHeight(truncated.length)}
      />
    )
  },

  /** Share / proportion donut. */
  'donut.share': (lines, { t, explicitTitle }) => {
    const { rows, title } = parseBarRows(lines)
    if (rows.length < 2) return null
    const data = rows.slice(0, MAX_DONUT_ROWS).map((r) => ({ label: r.label, value: r.value }))
    return (
      <DonutChartCard
        title={explicitTitle ?? title ?? t('chart.share')}
        data={data}
        category="value"
        index="label"
        height={220}
      />
    )
  },

  /** Time-series trend (what the heuristic already produced). */
  'line.trend': (lines, { t, explicitTitle }) => {
    const { rows, title } = parseLineRows(lines)
    if (rows.length < 2) return null
    const capped = rows.slice(0, MAX_LINE_POINTS)
    return (
      <LineChartCard
        title={explicitTitle ?? title ?? t('chart.trend')}
        data={capped.map((r) => ({ label: r.label, value: r.value }))}
        index="label"
        categories={['value']}
        colors={['cyan']}
        height={200}
      />
    )
  },

  /** Big number + optional caption — for headline metrics. */
  'kpi.single': (lines, { t, explicitTitle }) => {
    let value: string | null = null
    let title: string | undefined
    const captions: string[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (value == null) {
        const m = trimmed.match(NUMBER_ONLY_RE)
        if (m) {
          value = m[1]!.trim()
          continue
        }
        if (!title) {
          title = trimmed
          continue
        }
      }
      captions.push(trimmed)
    }
    if (!value) return null
    return (
      <div className="flex flex-col gap-1 px-4 py-5 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          {explicitTitle ?? title ?? t('chart.kpi')}
        </span>
        <span className="serif-num text-[40px] leading-none text-ink">{value}</span>
        {captions.length > 0 ? (
          <span className="mt-1 text-sm text-muted">{captions.join(' · ')}</span>
        ) : null}
      </div>
    )
  },
}

/* ── dispatcher ────────────────────────────────────────── */

export interface ParsedTemplate {
  id: TemplateId | null
  bodyLines: string[]
  explicitTitle?: string
}

/**
 * Strip an optional `[template:<id>]` tag from the first non-empty line.
 * If a tag is present, also peel off the next non-empty line and treat it
 * as the explicit title — that's the convention we ask the agent to use,
 * so the title is reliable instead of guessed.
 */
export function detectTemplate(text: string): ParsedTemplate {
  const lines = text.split('\n')
  let idx = 0
  while (idx < lines.length && !lines[idx]!.trim()) idx++
  if (idx >= lines.length) return { id: null, bodyLines: [] }

  const tagMatch = lines[idx]!.match(TEMPLATE_TAG_RE)
  if (!tagMatch) return { id: null, bodyLines: lines }

  const candidate = tagMatch[1]!.toLowerCase() as TemplateId
  const id: TemplateId | null = TEMPLATE_IDS.includes(candidate) ? candidate : null
  idx++

  // Adjacent non-empty line after the tag becomes the title.
  while (idx < lines.length && !lines[idx]!.trim()) idx++
  let explicitTitle: string | undefined
  if (idx < lines.length && !looksLikeData(lines[idx]!)) {
    explicitTitle = lines[idx]!.trim()
    idx++
  }

  return { id, bodyLines: lines.slice(idx), explicitTitle }
}

function looksLikeData(line: string): boolean {
  return BAR_ROW_RE.test(line) || LINE_ROW_RE.test(line) || NUMBER_ONLY_RE.test(line)
}

export function renderTemplate(
  id: TemplateId,
  bodyLines: string[],
  ctx: TemplateContext,
): ReactNode | null {
  const template = TEMPLATES[id]
  return template ? template(bodyLines, ctx) : null
}

/** Heuristic fallback when the agent didn't emit a tag: try bar, then line. */
export function renderHeuristic(text: string, t: Translator): ReactNode | null {
  const lines = text.split('\n')
  // Try bar first — `|` is much more distinctive than `:`.
  const bar = TEMPLATES['bar.distribution'](lines, { t })
  if (bar) return bar
  return TEMPLATES['line.trend'](lines, { t })
}
