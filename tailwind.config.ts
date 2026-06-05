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
  // Safelist every shade Tremor may pick from our palette. Cheap insurance
  // against future renames / new chart colours.
  safelist: [
    {
      pattern:
        /(bg|fill|stroke|text|border|ring)-(violet|cyan|amber|rose|emerald|indigo|sky|lime|orange|pink|teal)-(300|400|500|600)/,
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
        // tremor minimal aliases
        'tremor-brand': {
          DEFAULT: 'var(--primary)',
          muted: 'var(--primary-soft)',
          subtle: 'var(--primary-tint)',
          emphasis: 'var(--primary-deep)',
          inverted: 'var(--primary-on)',
        },
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
