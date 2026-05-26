// Single frontend source of truth for payment processors.
// Rates MIRROR api/calculate.py (PROCESSORS) and PROCESSORS.md — keep in sync.

export const PROCESSORS = {
  stripe: {
    name: 'Stripe',
    online: { percent: 2.9, fixed: 0.3 },
    in_person: { percent: 2.7, fixed: 0.05 },
  },
  toast: {
    name: 'Toast',
    online: { percent: 2.99, fixed: 0.15 },
    in_person: { percent: 2.49, fixed: 0.15 },
  },
  square: {
    name: 'Square',
    online: { percent: 3.3, fixed: 0.3 },
    in_person: { percent: 2.6, fixed: 0.15 },
  },
  clover: {
    name: 'Clover',
    online: { percent: 3.5, fixed: 0.1 },
    in_person: { percent: 2.6, fixed: 0.1 },
  },
}

// Ordered list for selects/radios, with a short rate descriptor for display.
export const PROCESSOR_LIST = [
  { id: 'stripe', name: 'Stripe', description: '2.9% + $0.30 online' },
  { id: 'toast', name: 'Toast', description: '2.99% + $0.15 online' },
  { id: 'square', name: 'Square', description: '3.3% + $0.30 online' },
  { id: 'clover', name: 'Clover', description: '3.5% + $0.10 online' },
]

// Per-transaction fee in dollars, matching api/calculate.py's calculate_processor_fee
// (percent applied to the amount, rounded HALF_UP to the cent, plus the fixed fee).
export function processorFee(amount, processorId, transactionType = 'online') {
  const proc = PROCESSORS[processorId]
  if (!proc) throw new Error(`Unknown processor: ${processorId}`)
  const rates = proc[transactionType]
  if (!rates) throw new Error(`Unknown transaction type: ${transactionType}`)
  // amount * (percent/100) expressed in cents is amount * percent.
  const percentFeeCents = Math.round(amount * rates.percent)
  const fixedCents = Math.round(rates.fixed * 100)
  return (percentFeeCents + fixedCents) / 100
}
