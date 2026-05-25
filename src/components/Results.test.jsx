import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Results from './Results'

function makeData(overrides = {}) {
  const calculations = {
    sales_tax: 1.65,
    total_charged: 31.64,
    processor_fees: {
      percent_rate: 2.9,
      fixed_rate: 0.3,
      percent_fee: 0.92,
      fixed_fee: 0.3,
      total_fee: 1.22,
    },
    total_costs: 16.22,
    net_profit: 13.77,
    profit_margin: 45.9,
    break_even_price: 15.78,
    ...(overrides.calculations || {}),
  }
  return {
    input: {
      item_price: 29.99,
      cost_of_goods: 10,
      shipping_cost: 5,
      tax_rate: 5.5,
      processor: 'Stripe',
      transaction_type: 'online',
      ...(overrides.input || {}),
    },
    calculations,
    monthly: {
      units: 100,
      revenue: 2999,
      costs: 1622,
      profit: 1377,
      ...(overrides.monthly || {}),
    },
    fee_breakdown: {
      cost_of_goods: 10,
      shipping: 5,
      processor_fee: 1.22,
      profit: 13.77,
      ...(overrides.fee_breakdown || {}),
    },
  }
}

describe('Results', () => {
  it('renders the key profit metrics', () => {
    render(<Results data={makeData()} />)
    expect(screen.getAllByText('$13.77').length).toBeGreaterThan(0)
    expect(screen.getByText(/45\.9% margin/)).toBeInTheDocument()
    expect(screen.getByText('$15.78')).toBeInTheDocument() // break-even
    expect(screen.getAllByText('$31.64').length).toBeGreaterThan(0) // total charged
  })

  it('shows the monthly projection section when units > 0', () => {
    render(<Results data={makeData()} />)
    expect(screen.getByText(/Monthly Projections/)).toBeInTheDocument()
  })

  it('hides the monthly projection section when units = 0', () => {
    render(<Results data={makeData({ monthly: { units: 0, revenue: 0, costs: 0, profit: 0 } })} />)
    expect(screen.queryByText(/Monthly Projections/)).not.toBeInTheDocument()
  })

  it('does not show a loss warning when the sale is profitable', () => {
    render(<Results data={makeData()} />)
    expect(screen.queryByText(/losing money/i)).not.toBeInTheDocument()
  })

  it('shows a loss warning when the sale is unprofitable', () => {
    const data = makeData({
      calculations: { net_profit: -2.5, profit_margin: -8.3, break_even_price: 18.0 },
      fee_breakdown: { cost_of_goods: 25, shipping: 5, processor_fee: 1.22, profit: -2.5 },
    })
    render(<Results data={data} />)
    expect(screen.getByText(/losing money/i)).toBeInTheDocument()
  })

  it('shows a low-margin tip when margin is below 20%', () => {
    const data = makeData({
      calculations: { net_profit: 2.0, profit_margin: 12.5, break_even_price: 9.0 },
    })
    render(<Results data={data} />)
    expect(screen.getByText(/profit margin is below 20%/i)).toBeInTheDocument()
  })
})
