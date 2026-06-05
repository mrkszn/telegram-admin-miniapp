import type { TelegramThemeParams, TelegramWebApp } from './sdk'

/**
 * Maps `themeParams` (from Telegram WebApp) → CSS variables on `:root`.
 * Outside Telegram the InsightFlow defaults from tokens.css apply.
 *
 * We deliberately set `--tg-theme-*` vars (so consumers can opt-in) AND
 * override the core token vars (`--bg`, `--surface`, `--ink`, ...) so that
 * existing Tailwind classes follow the Telegram chrome without any code
 * changes per screen.
 */

type ColorScheme = 'light' | 'dark'

interface ApplyResult {
  scheme: ColorScheme
  applied: Record<string, string>
}

const PARAM_TO_TG_VAR: Record<keyof TelegramThemeParams, string> = {
  bg_color: '--tg-theme-bg-color',
  text_color: '--tg-theme-text-color',
  hint_color: '--tg-theme-hint-color',
  link_color: '--tg-theme-link-color',
  button_color: '--tg-theme-button-color',
  button_text_color: '--tg-theme-button-text-color',
  secondary_bg_color: '--tg-theme-secondary-bg-color',
  header_bg_color: '--tg-theme-header-bg-color',
  accent_text_color: '--tg-theme-accent-text-color',
  section_bg_color: '--tg-theme-section-bg-color',
  section_header_text_color: '--tg-theme-section-header-text-color',
  subtitle_text_color: '--tg-theme-subtitle-text-color',
  destructive_text_color: '--tg-theme-destructive-text-color',
}

/** Token-var overrides driven by Telegram theme params. */
const PARAM_TO_TOKEN: Partial<Record<keyof TelegramThemeParams, string[]>> = {
  bg_color: ['--bg'],
  secondary_bg_color: ['--surface-2'],
  section_bg_color: ['--surface'],
  text_color: ['--ink'],
  hint_color: ['--muted'],
  button_color: ['--primary'],
  button_text_color: ['--primary-on'],
  accent_text_color: ['--accent'],
  destructive_text_color: ['--danger'],
}

/** All token vars Telegram may have written inline — used for cleanup. */
const ALL_TOKEN_OVERRIDES = Array.from(
  new Set(Object.values(PARAM_TO_TOKEN).flat()),
)

export function applyTelegramTheme(
  params: TelegramThemeParams | undefined,
  scheme: ColorScheme | undefined,
  options: { overrideTokens?: boolean; root?: HTMLElement } = {},
): ApplyResult {
  const root = options.root ?? document.documentElement
  const overrideTokens = options.overrideTokens ?? true
  const applied: Record<string, string> = {}

  if (scheme) {
    root.setAttribute('data-theme', scheme)
  }

  // User picked a forced theme (light/dark) — drop any prior inline token
  // overrides so the CSS rules from `[data-theme='...']` in tokens.css can
  // actually win. Without this step the previous Telegram-supplied values
  // stay on root.style and beat the class rules by specificity → cycling
  // the toggle changes the data-theme attribute but the visible palette
  // doesn't move.
  if (!overrideTokens) {
    for (const tok of ALL_TOKEN_OVERRIDES) {
      root.style.removeProperty(tok)
    }
  }

  if (!params) {
    return { scheme: scheme ?? 'light', applied }
  }

  for (const [key, value] of Object.entries(params)) {
    if (!value) continue
    const paramKey = key as keyof TelegramThemeParams
    const tgVar = PARAM_TO_TG_VAR[paramKey]
    if (tgVar) {
      // Always expose `--tg-theme-*` so consumers that explicitly opt-in
      // can read Telegram chrome colors even when we're in forced mode.
      root.style.setProperty(tgVar, value)
      applied[tgVar] = value
    }
    if (!overrideTokens) continue
    const tokens = PARAM_TO_TOKEN[paramKey]
    if (tokens) {
      for (const t of tokens) {
        root.style.setProperty(t, value)
        applied[t] = value
      }
    }
  }
  return { scheme: scheme ?? 'light', applied }
}

/**
 * Subscribes to Telegram theme changes. Returns a teardown.
 * No-op outside Telegram (returns a noop).
 */
export function subscribeTelegramTheme(
  tg: TelegramWebApp | null,
  onChange: (tg: TelegramWebApp) => void,
): () => void {
  if (!tg) return () => {}
  const handler = () => onChange(tg)
  tg.onEvent('themeChanged', handler)
  return () => tg.offEvent('themeChanged', handler)
}
