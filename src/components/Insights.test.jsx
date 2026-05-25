import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Insights from './Insights'

function entry(price, processor, margin, netProfit, fee) {
  return {
    id: Math.random(),
    timestamp: 'now',
    data: {
      input: { item_price: price, processor },
      calculations: {
        profit_margin: margin,
        net_profit: netProfit,
        processor_fees: { total_fee: fee },
      },
    },
  }
}

describe('Insights', () => {
  it('shows an empty state when there is no history', async () => {
    const onStart = vi.fn()
    render(<Insights history={[]} onStart={onStart} />)
    expect(screen.getByText(/No Insights Yet/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Start Calculating/i }))
    expect(onStart).toHaveBeenCalled()
  })

  it('renders aggregate metrics when history is present', () => {
    const history = [
      entry(30, 'Stripe', 50, 15, 1.0),
      entry(20, 'Toast', 40, 8, 0.8),
      entry(10, 'Stripe', 60, 6, 0.6),
    ]
    render(<Insights history={history} currency="USD" />)
    expect(screen.getByText(/Average Margin/i)).toBeInTheDocument()
    expect(screen.getByText('50.0%')).toBeInTheDocument()
    expect(screen.getByText(/Total Fees/i)).toBeInTheDocument()
  })
})
