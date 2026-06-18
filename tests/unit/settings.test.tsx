/**
 * /settings wiring — asserts:
 *  1. GET /admin/settings fires on mount and seeds the active selection
 *  2. picking a theme PUTs a partial { theme } and highlights the choice
 *  3. picking a language PUTs a partial { language }
 *  4. a failed PUT rolls the selection back and surfaces an error
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { AdminSettings, AdminSettingsUpdate } from '@/lib/api/types'

const fetchSettings = vi.fn<() => Promise<AdminSettings>>()
const updateSettings = vi.fn<(patch: AdminSettingsUpdate) => Promise<AdminSettings>>()

vi.mock('@/lib/api/admin', () => ({
  fetchSettings: () => fetchSettings(),
  updateSettings: (patch: AdminSettingsUpdate) => updateSettings(patch),
}))

const { SettingsRoute } = await import('@/routes/settings')

function defaults(): AdminSettings {
  return { theme: 'system', language: 'ru', notifications_enabled: true }
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
})

describe('SettingsRoute', () => {
  it('loads current settings and marks the active options', async () => {
    fetchSettings.mockResolvedValueOnce({ ...defaults(), theme: 'dark', language: 'en' })
    renderRoute()

    await waitFor(() => expect(fetchSettings).toHaveBeenCalledTimes(1))
    expect(await screen.findByRole('tab', { name: 'Тёмная' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'English' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('saves a partial { theme } when a theme is picked', async () => {
    fetchSettings.mockResolvedValueOnce(defaults())
    updateSettings.mockResolvedValueOnce({ ...defaults(), theme: 'light' })
    renderRoute()
    await screen.findByRole('tab', { name: 'Светлая' })

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Светлая' }))

    await waitFor(() => expect(updateSettings).toHaveBeenCalledTimes(1))
    expect(updateSettings.mock.calls[0]?.[0]).toEqual({ theme: 'light' })
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Светлая' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
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
  })

  it('rolls back the selection and shows an error when the save fails', async () => {
    fetchSettings.mockResolvedValueOnce(defaults())
    updateSettings.mockRejectedValueOnce({ status: 500, message: 'boom' })
    renderRoute()
    await screen.findByRole('tab', { name: 'Тёмная' })

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Тёмная' }))

    expect(await screen.findByText(/Не удалось сохранить/)).toBeInTheDocument()
    // 'system' (Системная) stays the active theme after rollback.
    expect(screen.getByRole('tab', { name: 'Системная' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('renders an error state with retry when the initial load fails', async () => {
    fetchSettings.mockRejectedValueOnce({ status: 0, message: 'offline' })
    renderRoute()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('exposes a gear → /settings nav contract via the rendered title', async () => {
    fetchSettings.mockResolvedValueOnce(defaults())
    renderRoute()
    expect(
      await screen.findByRole('heading', { name: 'Настройки' }),
    ).toBeInTheDocument()
    // bottom nav is still the shared 5-slot admin nav
    const nav = screen.getByRole('navigation', { name: 'Основная навигация' })
    expect(within(nav).getByText('Главная')).toBeInTheDocument()
  })
})
