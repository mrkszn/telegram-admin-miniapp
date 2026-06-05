/**
 * Shared Tremor colour set. Tremor only accepts a handful of named keys
 * (violet, cyan, etc.) — we keep the list in one place so chart cards
 * stay in lockstep.
 *
 * Order matters: first colour is the "primary" series. We lead with cyan
 * because it keeps high contrast on both light and dark surfaces — violet
 * looks great on paper but on the InsightFlow dark palette
 * (--bg #0b0e17) it sits too close to the surface and bars become hard
 * to see.
 */
export const CHART_COLORS = ['cyan', 'violet', 'amber', 'rose', 'emerald', 'indigo'] as const

export type ChartColor = (typeof CHART_COLORS)[number]
