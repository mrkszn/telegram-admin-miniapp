/**
 * /settings wiring — asserts:
 *  1. GET /admin/settings fires on mount and seeds the active language
 *  2. picking a language PUTs a partial { language } and highlights the choice
 *  3. a failed PUT rolls the selection back and surfaces an error
 *  4. the theme block is gone (owned by the top-level header toggle now)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { setLanguage } from '@/lib/i18n'
import type { AdminSettings, AdminSettingsUpdate } from '@/lib/api/types'

const fetchSettings = vi.fn<() => Promise<AdminSettings>>()
const updateSettings = vi.fn<(patch: AdminSettingsUpdate) => Promise<AdminSettings>>()

vi.mock('@/lib/api/admin', () => ({
  fetchSettings: () => fetchSettings(),
  updateSettings: (patch: AdminSettingsUpdate) => updateSettings(patch),
}))

const { SettingsRoute } = await import('@/routes/settings')

function defaults(): AdminSettings {
  return { theme: 'system', language: 'uk', notifications_enabled: true }
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <SettingsRoute />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchSettings.mockReset()
  updateSettings.mockReset()
  // Reset the shared language store so tests don't leak into one another.
  setLanguage('uk')
})

describe('SettingsRoute', () => {
  it('loads current settings and marks the active language', async () => {
    fetchSettings.mockResolvedValueOnce({ ...defaults(), language: 'en' })
    renderRoute()

    await waitFor(() => expect(fetchSettings).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole('tab', { name: 'English' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Українська' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
  })

  it('saves a partial { language } when a language is picked', async () => {
    fetchSettings.mockResolvedValueOnce(defaults())
    updateSettings.mockResolvedValueOnce({ ...defaults(), language: 'en' })
    renderRoute()
    await screen.findByRole('tab', { name: 'English' })

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'English' }))

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1))
    expect(updateSettings.mock.calls[0]?.[0]).toEqual({ language: 'en' })
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'English' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    )
  })

  it('rolls back the selection and shows an error when the save fails', async () => {
    fetchSettings.mockResolvedValueOnce(defaults())
    updateSettings.mockRejectedValueOnce({ status: 500, message: 'boom' })
    renderRoute()
    await screen.findByRole('tab', { name: 'English' })

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'English' }))

    expect(await screen.findByText(/Не вдалося зберегти/)).toBeInTheDocument()
    // Ukrainian stays the active language after rollback.
    expect(screen.getByRole('tab', { name: 'Українська' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('renders an error state with retry when the initial load fails', async () => {
    fetchSettings.mockRejectedValueOnce({ status: 0, message: 'offline' })
    renderRoute()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Повторити')).toBeInTheDocument()
  })

  it('exposes a gear → /settings nav contract via the rendered title', async () => {
    fetchSettings.mockResolvedValueOnce(defaults())
    renderRoute()
    expect(
      await screen.findByRole('heading', { name: 'Налаштування' }),
    ).toBeInTheDocument()
    // bottom nav is still the shared 5-slot admin nav
    const nav = screen.getByRole('navigation', { name: 'Основна навігація' })
    expect(within(nav).getByText('Головна')).toBeInTheDocument()
  })

  it('no longer renders the theme section', async () => {
    fetchSettings.mockResolvedValueOnce(defaults())
    renderRoute()
    await screen.findByRole('tab', { name: 'Українська' })
    // None of the old theme options should exist anymore.
    expect(screen.queryByRole('tab', { name: 'Світла' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Темна' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Системна' })).not.toBeInTheDocument()
  })
})
