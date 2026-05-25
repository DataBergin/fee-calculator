import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const sampleResponse = {
  input: {
    item_price: 29.99,
    cost_of_goods: 10,
    shipping_cost: 0,
    tax_rate: 0,
    processor: 'Stripe',
    transaction_type: 'online',
  },
  calculations: {
    sales_tax: 0,
    total_charged: 29.99,
    processor_fees: {
      percent_rate: 2.9,
      fixed_rate: 0.3,
      percent_fee: 0.87,
      fixed_fee: 0.3,
      total_fee: 1.17,
    },
    total_costs: 11.17,
    net_profit: 18.82,
    profit_margin: 62.75,
    break_even_price: 10.61,
  },
  monthly: { units: 0, revenue: 0, costs: 0, profit: 0 },
  fee_breakdown: { cost_of_goods: 10, shipping: 0, processor_fee: 1.17, profit: 18.82 },
}

describe('App history', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleResponse),
      })
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('appends a completed calculation to history', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Recent Activity starts empty
    expect(screen.getByText(/No calculations yet/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Selling Price/i), '29.99')
    await user.type(screen.getByLabelText(/Cost of Goods/i), '10')
    await user.click(screen.getByRole('button', { name: /Calculate Profit/i }))

    // After the calculation resolves, the sale shows up in Recent Activity.
    // "Profit: $18.82" is unique to the activity item (only rendered once
    // history is appended), so it is an unambiguous signal.
    expect(await screen.findByText(/Profit: \$18\.82/i)).toBeInTheDocument()
    expect(screen.getAllByText(/\$29\.99 sale/i).length).toBeGreaterThan(0)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/calculate',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
