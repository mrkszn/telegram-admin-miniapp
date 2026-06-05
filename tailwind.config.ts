import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Tremor generates colour utility classes at runtime
    // (`fill-violet-500`, `stroke-cyan-500`, …). Without this path Tailwind
    // tree-shakes them out and chart bars/lines render uncoloured — on dark
    // theme they become near-invisible against the surface.
    './node_modules/@tremor/**/*.{js,mjs,ts}',
  ],
  // Safelist every shade Tremor may pick from our palette + the Tremor
  // design tokens themselves (some are emitted only at runtime). Cheap
  // insurance against future renames / new chart colours.
  safelist: [
    {
      pattern:
        /(bg|fill|stroke|text|border|ring)-(violet|cyan|amber|rose|emerald|indigo|sky|lime|orange|pink|teal)-(300|400|500|600)/,
    },
    {
      pattern:
        /(bg|text|border|ring|shadow|fill|stroke)-(tremor|dark-tremor)-(brand|background|border|ring|content)(-(faint|muted|subtle|DEFAULT|emphasis|inverted|strong))?/,
    },
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '375px',
        md: '768px',
      },
    },
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-soft': 'var(--bg-soft)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          2: 'var(--muted-2)',
        },
        brand: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          deep: 'var(--primary-deep)',
          soft: 'var(--primary-soft)',
          tint: 'var(--primary-tint)',
          on: 'var(--primary-on)',
        },
        accent: 'var(--accent)',
        mint: 'var(--mint)',
        amber: 'var(--amber)',
        rose: 'var(--rose)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        // shadcn aliases
        background: 'var(--bg)',
        foreground: 'var(--ink)',
        border: 'var(--line)',
        input: 'var(--line)',
        ring: 'var(--primary)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-on)',
        },
        secondary: {
          DEFAULT: 'var(--surface-2)',
          foreground: 'var(--ink)',
        },
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--ink)',
        },
        popover: {
          DEFAULT: 'var(--surface)',
          foreground: 'var(--ink)',
        },
        // ── Tremor design tokens — full set so axis labels, gridlines,
        // tooltip text and tooltip background all follow the active theme.
        // Previously only `tremor-brand` was defined and the rest fell
        // through to Tremor defaults (gray-700 on white card) — on the
        // InsightFlow dark palette that resolved to near-black text on
        // near-black bg ("text не читается").
        tremor: {
          brand: {
            faint: 'var(--primary-tint)',
            muted: 'var(--primary-soft)',
            subtle: 'var(--primary)',
            DEFAULT: 'var(--primary)',
            emphasis: 'var(--primary-deep)',
            inverted: 'var(--primary-on)',
          },
          background: {
            muted: 'var(--bg-soft)',
            subtle: 'var(--surface-2)',
            DEFAULT: 'var(--surface)',
            emphasis: 'var(--ink)',
          },
          border: { DEFAULT: 'var(--line)' },
          ring: { DEFAULT: 'var(--line-strong)' },
          content: {
            subtle: 'var(--muted-2)',
            DEFAULT: 'var(--muted)',
            emphasis: 'var(--ink-2)',
            strong: 'var(--ink)',
            inverted: 'var(--primary-on)',
          },
        },
        'dark-tremor': {
          brand: {
            faint: 'var(--primary-tint)',
            muted: 'var(--primary-soft)',
            subtle: 'var(--primary)',
            DEFAULT: 'var(--primary)',
            emphasis: 'var(--primary-deep)',
            inverted: 'var(--primary-on)',
          },
          background: {
            muted: 'var(--bg-soft)',
            subtle: 'var(--surface-2)',
            DEFAULT: 'var(--surface)',
            emphasis: 'var(--ink)',
          },
          border: { DEFAULT: 'var(--line)' },
          ring: { DEFAULT: 'var(--line-strong)' },
          content: {
            subtle: 'var(--muted-2)',
            DEFAULT: 'var(--muted)',
            emphasis: 'var(--ink-2)',
            strong: 'var(--ink)',
            inverted: 'var(--primary-on)',
          },
        },
      },
      boxShadow: {
        // Tremor consumes its own shadow tokens for tooltip cards. Point
        // them at standard shadow + our line colour so tooltips stay on
        // brand on both themes (default would be hard-coded light).
        'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'tremor-card':
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'tremor-dropdown':
          '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'dark-tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'dark-tremor-card':
          '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
        'dark-tremor-dropdown':
          '0 6px 10px -2px rgb(0 0 0 / 0.4), 0 4px 6px -2px rgb(0 0 0 / 0.4)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        serif: ['var(--font-head)'],
      },
      borderRadius: {
        tag: 'var(--r-tag)',
        input: 'var(--r-input)',
        card: 'var(--r-card)',
        sheet: 'var(--r-sheet)',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'header': '44px',
        'nav': '56px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [animate],
}

export default config
