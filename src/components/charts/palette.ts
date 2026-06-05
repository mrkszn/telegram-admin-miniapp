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
// Order matters: first colour is the "primary" series. We lead with cyan
// because it keeps high contrast on both light and dark surfaces.
//
// IMPORTANT: `amber` and `rose` are intentionally NOT in this list. The
// project's `tailwind.config.ts` extends `theme.colors.amber` /
// `theme.colors.rose` to single CSS-var strings (for sentiment chips), which
// overwrites Tailwind's default amber/rose palettes — so classes like
// `fill-amber-500` aren't generated and Tremor renders those slices in solid
// black. Stick to colour names that we DON'T redefine.
export const CHART_COLORS = ['cyan', 'violet', 'emerald', 'pink', 'sky', 'indigo'] as const

export type ChartColor = (typeof CHART_COLORS)[number]
