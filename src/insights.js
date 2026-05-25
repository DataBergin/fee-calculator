// Derive aggregate business insights from saved calculation history.
// History items look like: { id, timestamp, data: { input, calculations } },
// newest first (as produced in App).

export function computeInsights(history) {
  if (!history || history.length === 0) return null

  const entries = history.map((item) => ({
    price: item.data.input.item_price,
    processor: item.data.input.processor,
    margin: item.data.calculations.profit_margin,
    netProfit: item.data.calculations.net_profit,
    fee: item.data.calculations.processor_fees.total_fee,
    timestamp: item.timestamp,
  }))

  const count = entries.length
  const avgMargin = entries.reduce((sum, e) => sum + e.margin, 0) / count
  const totalFees = entries.reduce((sum, e) => sum + e.fee, 0)
  const totalProfit = entries.reduce((sum, e) => sum + e.netProfit, 0)
  const best = entries.reduce((a, b) => (b.margin > a.margin ? b : a))
  const worst = entries.reduce((a, b) => (b.margin < a.margin ? b : a))

  const burdenByProcessor = {}
  for (const e of entries) {
    burdenByProcessor[e.processor] = (burdenByProcessor[e.processor] || 0) + e.fee
  }
  const feeByProcessor = Object.entries(burdenByProcessor).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }))

  // Oldest -> newest for a left-to-right trend line.
  const trend = [...entries].reverse().map((e, i) => ({
    index: i + 1,
    margin: e.margin,
    profit: e.netProfit,
  }))

  return {
    count,
    avgMargin: Math.round(avgMargin * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    best,
    worst,
    feeByProcessor,
    trend,
  }
}
