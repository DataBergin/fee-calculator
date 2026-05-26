import { processorFee } from './processors'

const DEFAULT_THRESHOLD = 10
const round2 = (x) => Math.round(x * 100) / 100

function median(sorted) {
  const n = sorted.length
  if (n === 0) return 0
  const mid = Math.floor(n / 2)
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// txns: [{ amount: number, fee?: number, type?: 'online' | 'in_person' }]
// opts: { processor, type, smallTicketThreshold }
// Returns null if there are no positive-amount transactions.
export function analyzeTransactions(txns, opts = {}) {
  const processor = opts.processor || 'stripe'
  const type = opts.type || 'online'
  const threshold = opts.smallTicketThreshold ?? DEFAULT_THRESHOLD

  const valid = (txns || []).filter(
    (t) => typeof t.amount === 'number' && Number.isFinite(t.amount) && t.amount > 0
  )
  const count = valid.length
  if (count === 0) return null

  const feesProvided = valid.every((t) => typeof t.fee === 'number' && Number.isFinite(t.fee))
  const feeFor = (t) => (feesProvided ? t.fee : processorFee(t.amount, processor, t.type || type))

  let totalVolume = 0
  let totalFees = 0
  for (const t of valid) {
    totalVolume += t.amount
    totalFees += feeFor(t)
  }

  const amounts = valid.map((t) => t.amount).sort((a, b) => a - b)
  const small = valid.filter((t) => t.amount <= threshold)
  const smallVolume = small.reduce((s, t) => s + t.amount, 0)
  const smallFees = small.reduce((s, t) => s + feeFor(t), 0)

  const buckets = [
    { label: '$0–5', min: 0, max: 5 },
    { label: '$5–10', min: 5, max: 10 },
    { label: '$10–25', min: 10, max: 25 },
    { label: '$25–50', min: 25, max: 50 },
    { label: '$50+', min: 50, max: Infinity },
  ]

  return {
    count,
    totalVolume: round2(totalVolume),
    totalFees: round2(totalFees),
    averageTicket: round2(totalVolume / count),
    medianTicket: round2(median(amounts)),
    effectiveRate: totalVolume > 0 ? round2((totalFees / totalVolume) * 100) : 0,
    feesEstimated: !feesProvided,
    smallTicketDrag: {
      threshold,
      count: small.length,
      volume: round2(smallVolume),
      fees: round2(smallFees),
      effectiveRate: smallVolume > 0 ? round2((smallFees / smallVolume) * 100) : 0,
    },
    ticketBuckets: buckets.map((b) => ({
      label: b.label,
      count: valid.filter((t) => t.amount > b.min && t.amount <= b.max).length,
    })),
  }
}
