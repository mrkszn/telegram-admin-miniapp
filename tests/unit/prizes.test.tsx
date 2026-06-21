/**
 * /prizes wiring — asserts:
 *  1. GET /admin/prizes hydrates 3 tier cards
 *  2. editing fields enables Save and PUTs only the changed keys
 *  3. a failed PUT surfaces the error and leaves the draft editable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type {
  PrizeTier,
  PrizeTierOut,
  PrizeTierUpdate,
  PrizesResponse,
} from '@/lib/api/types'

const getPrizes = vi.fn<() => Promise<PrizesResponse>>()
const updatePrize =
  vi.fn<(tier: PrizeTier, body: PrizeTierUpdate) => Promise<PrizeTierOut>>()

vi.mock('@/lib/api/admin', () => ({
  getPrizes: () => getPrizes(),
  updatePrize: (tier: PrizeTier, body: PrizeTierUpdate) => updatePrize(tier, body),
}))

const { PrizesRoute } = await import('@/routes/prizes')

function snapshot(): PrizesResponse {
  return {
    prizes: [
      { tier: 'small', code: 'SML-1', label_uk: 'Мала', label_en: 'Small one' },
      { tier: 'medium', code: 'MED-1', label_uk: 'Середня', label_en: 'Medium one' },
      { tier: 'large', code: 'LRG-1', label_uk: 'Велика', label_en: 'Large one' },
    ],
  }
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/prizes']}>
      <PrizesRoute />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  getPrizes.mockReset()
  updatePrize.mockReset()
})

describe('PrizesRoute', () => {
  it('renders one card per tier, seeded from GET /admin/prizes', async () => {
    getPrizes.mockResolvedValueOnce(snapshot())
    renderRoute()

    expect(await screen.findByRole('heading', { name: 'Маленький' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Середній' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Великий' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('SML-1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('MED-1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('LRG-1')).toBeInTheDocument()
  })

  it('PUTs only the changed fields and reflects the canonical response', async () => {
    getPrizes.mockResolvedValueOnce(snapshot())
    updatePrize.mockResolvedValueOnce({
      tier: 'small',
      code: 'SML-2',
      label_uk: 'Мала',
      label_en: 'Small one',
    })
    renderRoute()

    const heading = await screen.findByRole('heading', { name: 'Маленький' })
    const card = heading.closest('section') as HTMLElement
    expect(card).not.toBeNull()

    const codeInput = within(card).getByDisplayValue('SML-1') as HTMLInputElement
    const saveButton = within(card).getByRole('button', { name: 'Зберегти' })

    expect(saveButton).toBeDisabled()

    const user = userEvent.setup()
    await user.clear(codeInput)
    await user.type(codeInput, 'SML-2')
    expect(saveButton).toBeEnabled()

    await user.click(saveButton)

    await waitFor(() => expect(updatePrize).toHaveBeenCalledTimes(1))
    expect(updatePrize.mock.calls[0]?.[0]).toBe('small')
    expect(updatePrize.mock.calls[0]?.[1]).toEqual({ code: 'SML-2' })
    await waitFor(() => expect(within(card).getByText('Збережено')).toBeInTheDocument())
  })

  it('surfaces an error and keeps the dirty draft when the PUT fails', async () => {
    getPrizes.mockResolvedValueOnce(snapshot())
    updatePrize.mockRejectedValueOnce({ status: 500, message: 'boom' })
    renderRoute()

    const heading = await screen.findByRole('heading', { name: 'Середній' })
    const card = heading.closest('section') as HTMLElement
    const codeInput = within(card).getByDisplayValue('MED-1') as HTMLInputElement
    const saveButton = within(card).getByRole('button', { name: 'Зберегти' })

    const user = userEvent.setup()
    await user.clear(codeInput)
    await user.type(codeInput, 'MED-X')
    await user.click(saveButton)

    expect(await within(card).findByText(/Не вдалося зберегти/)).toBeInTheDocument()
    // draft is preserved so the user can retry
    expect(within(card).getByDisplayValue('MED-X')).toBeInTheDocument()
  })

  it('shows an error state with retry when the initial load fails', async () => {
    getPrizes.mockRejectedValueOnce({ status: 0, message: 'offline' })
    renderRoute()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Повторити')).toBeInTheDocument()
  })
})
