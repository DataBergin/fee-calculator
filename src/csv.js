// CSV export for calculations and history. Pure string builders (testable) plus
// a small browser download helper.

const HEADER = [
  'Time',
  'Item Price',
  'Cost of Goods',
  'Shipping',
  'Tax Rate %',
  'Processor',
  'Transaction',
  'Sales Tax',
  'Total Charged',
  'Processor Fee',
  'Net Profit',
  'Margin %',
  'Break-even',
]

export function escapeCell(value) {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function rowFor(item) {
  const i = item.data.input
  const c = item.data.calculations
  return [
    item.timestamp,
    i.item_price,
    i.cost_of_goods,
    i.shipping_cost,
    i.tax_rate,
    i.processor,
    i.transaction_type,
    c.sales_tax,
    c.total_charged,
    c.processor_fees.total_fee,
    c.net_profit,
    c.profit_margin,
    c.break_even_price,
  ]
}

export function historyToCsv(history) {
  const rows = history.map(rowFor)
  return [HEADER, ...rows].map((r) => r.map(escapeCell).join(',')).join('\n')
}

export function calculationToCsv(data, timestamp = new Date().toLocaleString()) {
  return historyToCsv([{ timestamp, data }])
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
