/**
 * Thin, type-safe wrapper over `window.Telegram?.WebApp`.
 *
 * We deliberately avoid importing `@twa-dev/sdk` here — the official script
 * is loaded from `index.html`, so we can read the singleton directly and skip
 * a duplicate runtime. The `@twa-dev/sdk` peer is kept as a fallback that an
 * instance can opt into if it wants the SDK's lifecycle helpers.
 */

export interface TelegramThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
  header_bg_color?: string
  accent_text_color?: string
  section_bg_color?: string
  section_header_text_color?: string
  subtitle_text_color?: string
  destructive_text_color?: string
}

export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  selectionChanged(): void
}

export interface TelegramBackButton {
  isVisible: boolean
  show(): void
  hide(): void
  onClick(cb: () => void): void
  offClick(cb: () => void): void
}

export interface TelegramMainButton {
  text: string
  isVisible: boolean
  isActive: boolean
  show(): void
  hide(): void
  enable(): void
  disable(): void
  setText(text: string): void
  onClick(cb: () => void): void
  offClick(cb: () => void): void
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      language_code?: string
    }
    auth_date?: number
    hash?: string
    start_param?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: TelegramThemeParams
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  ready(): void
  expand(): void
  close(): void
  onEvent(
    event: 'themeChanged' | 'viewportChanged' | 'mainButtonClicked' | 'backButtonClicked',
    cb: () => void,
  ): void
  offEvent(
    event: 'themeChanged' | 'viewportChanged' | 'mainButtonClicked' | 'backButtonClicked',
    cb: () => void,
  ): void
  BackButton: TelegramBackButton
  MainButton: TelegramMainButton
  HapticFeedback?: TelegramHapticFeedback
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export function getTelegram(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp ?? null
}

let readyCalled = false

/** Idempotent. Safe to call from any number of mount points. */
export function readyTelegram(): TelegramWebApp | null {
  const tg = getTelegram()
  if (!tg) return null
  if (!readyCalled) {
    try {
      tg.ready()
      tg.expand()
    } catch {
      // older Telegram clients may throw — non-fatal
    }
    readyCalled = true
  }
  return tg
}

export function getInitData(): string {
  return getTelegram()?.initData ?? ''
}

/** True iff the page is rendered inside the Telegram WebView. */
export function isInsideTelegram(): boolean {
  return Boolean(getTelegram()?.initData)
}
