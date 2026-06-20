/**
 * `lazyWithRetry` + `RouteErrorBoundary` together must:
 *  - resolve the import on first try in the happy path
 *  - retry a chunk-load error a couple of times before giving up
 *  - on terminal failure, trigger a one-shot window.location.reload(),
 *    guarded by sessionStorage so a broken deploy can't loop
 *  - rethrow non-chunk errors immediately (no reload)
 *  - and: the RouteErrorBoundary renders a localized fallback when a
 *    non-chunk error reaches it
 */
import { Component, type ReactNode, Suspense, createElement } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act, waitFor, screen } from '@testing-library/react'
import { isChunkLoadError, clearChunkReloadFlag, lazyWithRetry } from '@/lib/lazy-with-retry'
import { RouteErrorBoundary } from '@/components/feedback/RouteErrorBoundary'
import { setLanguage } from '@/lib/i18n'

class CatchAll extends Component<{ children: ReactNode }, { err: unknown }> {
  state = { err: null as unknown }
  static getDerivedStateFromError(err: unknown) {
    return { err }
  }
  render() {
    return this.state.err ? createElement('div', null, 'boundary') : this.props.children
  }
}

describe('isChunkLoadError', () => {
  it('matches the common dynamic-import failure messages', () => {
    expect(
      isChunkLoadError(new Error('Failed to fetch dynamically imported module: /a.js')),
    ).toBe(true)
    expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Loading chunk 42 failed'))).toBe(true)
    expect(isChunkLoadError(new Error('Loading CSS chunk 11 failed'))).toBe(true)
    const named = new Error('boom') as Error & { name: string }
    named.name = 'ChunkLoadError'
    expect(isChunkLoadError(named)).toBe(true)
  })
  it('does NOT match unrelated render errors', () => {
    expect(isChunkLoadError(new Error('Cannot read property foo of undefined'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})

describe('lazyWithRetry import pipeline', () => {
  let reloadSpy: ReturnType<typeof vi.fn>
  beforeEach(() => {
    window.sessionStorage.clear()
    clearChunkReloadFlag()
    setLanguage('uk')
    reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadSpy, href: 'http://localhost/' },
    })
  })

  it('triggers exactly one reload after repeated chunk-load failures', async () => {
    const failing = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch dynamically imported module: /a.js')),
    )
    const Lazy = lazyWithRetry(failing)
    await act(async () => {
      render(
        <CatchAll>
          <Suspense fallback={<div>loading</div>}>
            <Lazy />
          </Suspense>
        </CatchAll>,
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1200))
    })
    expect(failing).toHaveBeenCalledTimes(3)
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem('mini_app.chunk_reload_v1')).toBe('1')
  })

  it('does NOT reload twice in a row — second failure surfaces to the boundary', async () => {
    window.sessionStorage.setItem('mini_app.chunk_reload_v1', '1')
    const failing = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch dynamically imported module: /a.js')),
    )
    const Lazy = lazyWithRetry(failing)
    await act(async () => {
      render(
        <CatchAll>
          <Suspense fallback={<div>loading</div>}>
            <Lazy />
          </Suspense>
        </CatchAll>,
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1200))
    })
    expect(reloadSpy).not.toHaveBeenCalled()
    expect(screen.getByText('boundary')).toBeInTheDocument()
  })

  it('rethrows non-chunk errors immediately (no retry, no reload)', async () => {
    const failing = vi.fn(() => Promise.reject(new Error('Cannot read property foo of undefined')))
    const Lazy = lazyWithRetry(failing)
    await act(async () => {
      render(
        <CatchAll>
          <Suspense fallback={<div>loading</div>}>
            <Lazy />
          </Suspense>
        </CatchAll>,
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(failing).toHaveBeenCalledTimes(1)
    expect(reloadSpy).not.toHaveBeenCalled()
  })
})

describe('RouteErrorBoundary fallback UI', () => {
  beforeEach(() => {
    setLanguage('uk')
  })

  it('renders the chunk-aware ukrainian copy and a Reload button on chunk errors', async () => {
    const failing = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch dynamically imported module: /a.js')),
    )
    window.sessionStorage.setItem('mini_app.chunk_reload_v1', '1')
    const Lazy = lazyWithRetry(failing)
    await act(async () => {
      render(
        <RouteErrorBoundary>
          <Suspense fallback={<div>loading</div>}>
            <Lazy />
          </Suspense>
        </RouteErrorBoundary>,
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1200))
    })
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText(/Не вдалося завантажити цей розділ/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Оновити/ })).toBeInTheDocument()
  })

  it('switches the fallback copy to english when language flips', async () => {
    setLanguage('en')
    const failing = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch dynamically imported module: /a.js')),
    )
    window.sessionStorage.setItem('mini_app.chunk_reload_v1', '1')
    const Lazy = lazyWithRetry(failing)
    await act(async () => {
      render(
        <RouteErrorBoundary>
          <Suspense fallback={<div>loading</div>}>
            <Lazy />
          </Suspense>
        </RouteErrorBoundary>,
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1200))
    })
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText(/Couldn’t load this section/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reload/ })).toBeInTheDocument()
  })
})
