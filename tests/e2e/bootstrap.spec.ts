import { test, expect } from '@playwright/test'

/**
 * Bootstrap smoke. Injects a fake `window.Telegram.WebApp` + intercepts the
 * auth POST so we can verify the full chain (initData → JWT → redirect →
 * /dashboard render) without any real backend.
 */

test('bootstraps auth and renders /dashboard', async ({ page, context }) => {
  // The real telegram-web-app.js script (loaded from index.html) would
  // overwrite our window.Telegram mock — block it.
  await context.route('**/telegram-web-app.js', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }),
  )

  await context.addInitScript(() => {
    const win = window as unknown as {
      Telegram?: { WebApp?: Record<string, unknown> }
    }
    const noop = () => {}
    win.Telegram = {
      WebApp: {
        initData: 'query_id=AA&user=%7B%22id%22%3A42%7D&hash=abc',
        initDataUnsafe: { user: { id: 42, first_name: 'Alex' } },
        version: '7.0',
        platform: 'web',
        colorScheme: 'light',
        themeParams: { bg_color: '#f7f6f2', text_color: '#0b0b12' },
        isExpanded: true,
        viewportHeight: 800,
        viewportStableHeight: 800,
        ready: noop,
        expand: noop,
        close: noop,
        onEvent: noop,
        offEvent: noop,
        BackButton: {
          isVisible: false,
          show: noop,
          hide: noop,
          onClick: noop,
          offClick: noop,
        },
        MainButton: {
          text: '',
          isVisible: false,
          isActive: false,
          show: noop,
          hide: noop,
          enable: noop,
          disable: noop,
          setText: noop,
          onClick: noop,
          offClick: noop,
        },
      },
    }
  })

  await page.route('**/admin/auth', async (route) => {
    const request = route.request()
    expect(request.method()).toBe('POST')
    const body = await request.postDataJSON()
    expect(body).toMatchObject({ init_data: expect.stringContaining('query_id') })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'jwt-e2e',
        telegram_id: 42,
      }),
    })
  })

  await page.goto('/')
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 })
  await expect(page.getByRole('heading', { name: 'Зведення' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Основна навігація' })).toBeVisible()
})
