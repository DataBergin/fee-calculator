import { describe, it, expect } from 'vitest'
import { computeInsights } from './insights'

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

describe('computeInsights', () => {
  it('returns null for empty or missing history', () => {
    expect(computeInsights([])).toBeNull()
    expect(computeInsights(null)).toBeNull()
  })

  it('aggregates margins, fees, and profit across history', () => {
    // newest first: C, B, A
    const history = [
      entry(30, 'Stripe', 50, 15, 1.0),
      entry(20, 'Toast', 40, 8, 0.8),
      entry(10, 'Stripe', 60, 6, 0.6),
    ]
    const insights = computeInsights(history)
    expect(insights.count).toBe(3)
    expect(insights.avgMargin).toBe(50)
    expect(insights.totalFees).toBe(2.4)
    expect(insights.totalProfit).toBe(29)
  })

  it('identifies the best and worst margin items', () => {
    const history = [
      entry(30, 'Stripe', 50, 15, 1.0),
      entry(20, 'Toast', 40, 8, 0.8),
      entry(10, 'Stripe', 60, 6, 0.6),
    ]
    const insights = computeInsights(history)
    expect(insights.best.margin).toBe(60)
    expect(insights.worst.margin).toBe(40)
  })

  it('sums fee burden per processor', () => {
    const history = [
      entry(30, 'Stripe', 50, 15, 1.0),
      entry(20, 'Toast', 40, 8, 0.8),
      entry(10, 'Stripe', 60, 6, 0.6),
    ]
    const byProc = computeInsights(history).feeByProcessor
    const stripe = byProc.find((p) => p.name === 'Stripe')
    const toast = byProc.find((p) => p.name === 'Toast')
    expect(stripe.value).toBe(1.6)
    expect(toast.value).toBe(0.8)
  })

  it('orders the trend oldest-first', () => {
    const history = [
      entry(30, 'Stripe', 50, 15, 1.0),
      entry(20, 'Toast', 40, 8, 0.8),
      entry(10, 'Stripe', 60, 6, 0.6),
    ]
    const trend = computeInsights(history).trend
    expect(trend.map((t) => t.margin)).toEqual([60, 40, 50])
    expect(trend[0].index).toBe(1)
  })
})
