import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KPICard } from '@/components/kpi/KPICard'

describe('KPICard', () => {
  it('renders label, value, caption and delta', () => {
    render(
      <KPICard
        label="Active users"
        value="1 248"
        caption="Last 7 days"
        delta="+8.2%"
        deltaKind="positive"
      />,
    )
    expect(screen.getByText('Active users')).toBeInTheDocument()
    expect(screen.getByText('1 248')).toBeInTheDocument()
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
    expect(screen.getByText('+8.2%')).toBeInTheDocument()
  })

  it('renders value with serif-num class for editorial numerals', () => {
    render(<KPICard label="x" value="42" />)
    expect(screen.getByText('42').className).toMatch(/serif-num/)
  })

  it('omits delta block when delta is not provided', () => {
    const { container } = render(<KPICard label="x" value="42" />)
    expect(container.querySelector('[class*="rounded-tag"]')).toBeNull()
  })
})
