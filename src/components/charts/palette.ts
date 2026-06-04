/**
 * Shared Tremor colour set. Tremor only accepts a handful of named keys
 * (violet, cyan, etc.) — we keep the list in one place so chart cards
 * stay in lockstep.
 */
export const CHART_COLORS = ['violet', 'cyan', 'amber', 'rose', 'emerald', 'indigo'] as const

export type ChartColor = (typeof CHART_COLORS)[number]
