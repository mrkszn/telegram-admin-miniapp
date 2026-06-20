/**
 * Resilient `React.lazy` for routes loaded as separate chunks.
 *
 * After a deploy, an already-open tab is still holding the OLD index.html in
 * memory — and that old shell references chunk filenames (hashed) that the
 * new deploy no longer serves. The first time the user navigates to a lazy
 * route, the dynamic `import()` 404s with `Failed to fetch dynamically
 * imported module` (Chrome) / `error loading dynamically imported module`
 * (Safari) / `ChunkLoadError` (webpack-style bundlers). React surfaces that
 * as a render-time crash, which the user reads as "the section is broken".
 *
 * Strategy:
 *  1. Retry the import a couple of times with a short backoff — covers
 *     transient flakes (slow CDN, mobile network blip).
 *  2. If every retry fails with what looks like a chunk-load error, reload
 *     the page ONCE. A sessionStorage flag prevents an infinite loop if the
 *     fresh page also fails to load chunks (e.g. CDN is genuinely down).
 *  3. Otherwise rethrow so the route ErrorBoundary can render a localized
 *     fallback with a manual "reload" button.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const RELOAD_FLAG = 'mini_app.chunk_reload_v1'

/** Heuristic — module-load failures aren't a single typed error class. */
export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false
  const e = err as { name?: string; message?: string }
  const name = e.name ?? ''
  const msg = e.message ?? ''
  if (name === 'ChunkLoadError') return true
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Loading chunk \S+ failed/i.test(msg) ||
    /Loading CSS chunk \S+ failed/i.test(msg)
  )
}

interface RetryOptions {
  retries?: number
  /** Backoff between retries in ms. */
  delayMs?: number
}

async function importWithRetry<T>(
  factory: () => Promise<T>,
  { retries = 2, delayMs = 250 }: RetryOptions = {},
): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await factory()
    } catch (err) {
      lastErr = err
      if (!isChunkLoadError(err)) throw err
      if (i < retries) await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
    }
  }
  // Every retry failed AND each failure looked like a chunk-load error.
  // Try a one-shot full reload — the hashed chunk filename mismatch goes
  // away as soon as the browser pulls fresh index.html. The session flag
  // guarantees we don't loop if the reload itself can't load chunks.
  if (typeof window !== 'undefined') {
    try {
      const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG)
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
        // Block the throw — the reload is in flight.
        return new Promise(() => {})
      }
    } catch {
      /* sessionStorage may be locked down (private mode) — fall through */
    }
  }
  throw lastErr
}

/**
 * Clear the reload guard. Call from app bootstrap once the new shell has
 * successfully rendered something so the next deploy's chunk miss can use
 * the one-shot reload again.
 */
export function clearChunkReloadFlag(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(RELOAD_FLAG)
  } catch {
    /* swallow */
  }
}

/**
 * Drop-in replacement for `React.lazy` that survives a chunk hash
 * mismatch after a deploy.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() => importWithRetry(factory))
}
