import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatWidget } from '@/components/chat/ChatWidget'

describe('ChatWidget', () => {
  it('renders existing messages and submits on Enter', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(
      <ChatWidget
        messages={[
          { id: '1', role: 'user', content: 'Привет' },
          { id: '2', role: 'agent', content: 'Здравствуйте' },
        ]}
        onSubmit={onSubmit}
      />,
    )
    expect(screen.getByText('Привет')).toBeInTheDocument()
    expect(screen.getByText('Здравствуйте')).toBeInTheDocument()
    const input = screen.getByLabelText('Повідомлення')
    await user.type(input, 'Покажи метрики{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('Покажи метрики')
    expect(input).toHaveValue('')
  })

  it('does not submit empty / whitespace-only input', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ChatWidget messages={[]} onSubmit={onSubmit} />)
    const input = screen.getByLabelText('Повідомлення')
    await user.type(input, '   {Enter}')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('inserts newline on Shift+Enter without submitting', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ChatWidget messages={[]} onSubmit={onSubmit} />)
    const input = screen.getByLabelText('Повідомлення') as HTMLTextAreaElement
    await user.type(input, 'a{Shift>}{Enter}{/Shift}b')
    expect(onSubmit).not.toHaveBeenCalled()
    expect(input.value).toContain('\n')
  })

  it('disables input + send while busy', () => {
    render(<ChatWidget messages={[]} onSubmit={() => {}} isBusy />)
    expect(screen.getByLabelText('Повідомлення')).toBeDisabled()
    expect(screen.getByLabelText('Відправити')).toBeDisabled()
  })
})
