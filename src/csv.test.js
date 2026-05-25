import { describe, it, expect } from 'vitest'
import { escapeCell, historyToCsv, calculationToCsv } from './csv'

const sample = {
  timestamp: '5/25/2026, 9:00:00 AM',
  data: {
    input: {
      item_price: 29.99,
      cost_of_goods: 10,
      shipping_cost: 5,
      tax_rate: 5.5,
      processor: 'Stripe',
      transaction_type: 'online',
    },
    calculations: {
      sales_tax: 1.65,
      total_charged: 31.64,
      processor_fees: { total_fee: 1.22 },
      net_profit: 13.77,
      profit_margin: 45.9,
      break_even_price: 15.78,
    },
  },
}

describe('escapeCell', () => {
  it('leaves simple values untouched', () => {
    expect(escapeCell('Stripe')).toBe('Stripe')
    expect(escapeCell(29.99)).toBe('29.99')
  })

  it('quotes and escapes values containing commas, quotes, or newlines', () => {
    expect(escapeCell('a,b')).toBe('"a,b"')
    expect(escapeCell('say "hi"')).toBe('"say ""hi"""')
  })

  it('renders null/undefined as empty', () => {
    expect(escapeCell(null)).toBe('')
    expect(escapeCell(undefined)).toBe('')
  })
})

describe('historyToCsv', () => {
  it('emits a header row plus one row per item', () => {
    const csv = historyToCsv([sample, sample])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3) // header + 2
    expect(lines[0]).toContain('Item Price')
    expect(lines[0]).toContain('Net Profit')
  })

  it('includes the calculated values in the row', () => {
    const csv = historyToCsv([sample])
    const dataLine = csv.split('\n')[1]
    expect(dataLine).toContain('29.99')
    expect(dataLine).toContain('Stripe')
    expect(dataLine).toContain('13.77')
    expect(dataLine).toContain('45.9')
  })
})

describe('calculationToCsv', () => {
  it('produces a header and a single data row', () => {
    const csv = calculationToCsv(sample.data, 'now')
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toContain('now')
  })
})
