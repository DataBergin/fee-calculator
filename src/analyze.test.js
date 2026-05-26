import { describe, it, expect } from 'vitest'
import { analyzeTransactions } from './analyze'
import { processorFee } from './processors'

describe('analyzeTransactions', () => {
  it('returns null when there are no positive amounts', () => {
    expect(analyzeTransactions([])).toBeNull()
    expect(analyzeTransactions([{ amount: 0 }, { amount: -5 }])).toBeNull()
    expect(analyzeTransactions([{ amount: NaN }])).toBeNull()
  })

  it('uses actual fees when every row has one', () => {
    const txns = [
      { amount: 10, fee: 0.6 },
      { amount: 30, fee: 1.2 },
      { amount: 60, fee: 2.0 },
    ]
    const a = analyzeTransactions(txns)
    expect(a.feesEstimated).toBe(false)
    expect(a.count).toBe(3)
    expect(a.totalVolume).toBe(100)
    expect(a.totalFees).toBe(3.8)
    expect(a.effectiveRate).toBe(3.8) // 3.8 / 100 * 100
    expect(a.averageTicket).toBeCloseTo(33.33, 2)
    expect(a.medianTicket).toBe(30)
  })

  it('estimates fees from the rate model when no fee column is present', () => {
    const txns = [{ amount: 100 }, { amount: 100 }]
    const a = analyzeTransactions(txns, { processor: 'stripe', type: 'online' })
    expect(a.feesEstimated).toBe(true)
    expect(a.totalFees).toBeCloseTo(processorFee(100, 'stripe', 'online') * 2, 2) // 3.20 * 2
  })

  it('computes small-ticket drag against the threshold', () => {
    const txns = [{ amount: 4 }, { amount: 5 }, { amount: 50 }]
    const a = analyzeTransactions(txns, { processor: 'stripe', smallTicketThreshold: 10 })
    expect(a.smallTicketDrag.count).toBe(2) // the $4 and $5
    // small tickets carry a much higher effective rate than the big one
    expect(a.smallTicketDrag.effectiveRate).toBeGreaterThan(a.effectiveRate)
  })

  it('buckets ticket sizes', () => {
    const txns = [{ amount: 3 }, { amount: 7 }, { amount: 20 }, { amount: 40 }, { amount: 100 }]
    const a = analyzeTransactions(txns)
    expect(a.ticketBuckets.map((b) => b.count)).toEqual([1, 1, 1, 1, 1])
  })
})
