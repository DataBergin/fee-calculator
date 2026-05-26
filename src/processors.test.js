import { describe, it, expect } from 'vitest'
import { processorFee, PROCESSORS, PROCESSOR_LIST } from './processors'

describe('processorFee (parity with api/calculate.py)', () => {
  it('matches Stripe anchors', () => {
    expect(processorFee(10.55, 'stripe', 'online')).toBeCloseTo(0.61, 2) // 0.31 + 0.30
    expect(processorFee(5.0, 'stripe', 'online')).toBeCloseTo(0.45, 2) // HALF_UP 0.145 -> 0.15
    expect(processorFee(100, 'stripe', 'in_person')).toBeCloseTo(2.75, 2)
  })

  it('matches Toast anchors', () => {
    expect(processorFee(100, 'toast', 'online')).toBeCloseTo(3.14, 2)
    expect(processorFee(100, 'toast', 'in_person')).toBeCloseTo(2.64, 2)
  })

  it('matches Square and Clover anchors', () => {
    expect(processorFee(100, 'square', 'online')).toBeCloseTo(3.6, 2)
    expect(processorFee(100, 'square', 'in_person')).toBeCloseTo(2.75, 2)
    expect(processorFee(100, 'clover', 'online')).toBeCloseTo(3.6, 2)
    expect(processorFee(100, 'clover', 'in_person')).toBeCloseTo(2.7, 2)
  })

  it('throws on unknown processor or transaction type', () => {
    expect(() => processorFee(10, 'venmo', 'online')).toThrow()
    expect(() => processorFee(10, 'stripe', 'phone')).toThrow()
  })
})

describe('processor metadata', () => {
  it('list ids all exist in the rate map', () => {
    for (const p of PROCESSOR_LIST) {
      expect(PROCESSORS[p.id]).toBeDefined()
      expect(PROCESSORS[p.id].online).toHaveProperty('percent')
      expect(PROCESSORS[p.id].in_person).toHaveProperty('fixed')
    }
  })
})
