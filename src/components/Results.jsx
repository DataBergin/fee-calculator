import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#22c55e']

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function Results({ data }) {
  const { input, calculations, monthly, fee_breakdown } = data

  // Prepare pie chart data
  const pieData = [
    { name: 'Cost of Goods', value: fee_breakdown.cost_of_goods },
    { name: 'Shipping', value: fee_breakdown.shipping },
    { name: 'Processor Fee', value: fee_breakdown.processor_fee },
    { name: 'Net Profit', value: Math.max(0, fee_breakdown.profit) },
  ].filter((item) => item.value > 0)

  // Monthly projection bar data
  const monthlyData =
    monthly.units > 0
      ? [
          { name: 'Revenue', amount: monthly.revenue },
          { name: 'Costs', amount: monthly.costs },
          { name: 'Profit', amount: monthly.profit },
        ]
      : []

  const isProfit = calculations.net_profit >= 0

  return (
    <div className="results">
      <div className="results-header">
        <h2>Profit Breakdown</h2>
        <p>
          For a {formatCurrency(input.item_price)} sale via {input.processor}
        </p>
      </div>

      <div className="results-grid">
        {/* Key Metrics */}
        <div className="metric-card highlight">
          <span className="metric-label">Net Profit Per Sale</span>
          <span className={`metric-value ${isProfit ? 'positive' : 'negative'}`}>
            {formatCurrency(calculations.net_profit)}
          </span>
          <span className="metric-sub">{calculations.profit_margin.toFixed(1)}% margin</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Total Customer Pays</span>
          <span className="metric-value">{formatCurrency(calculations.total_charged)}</span>
          <span className="metric-sub">Including {formatCurrency(calculations.sales_tax)} tax</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Processor Fee</span>
          <span className="metric-value negative">
            {formatCurrency(calculations.processor_fees.total_fee)}
          </span>
          <span className="metric-sub">
            {calculations.processor_fees.percent_rate}% +{' '}
            {formatCurrency(calculations.processor_fees.fixed_rate)}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Break-Even Price</span>
          <span className="metric-value">{formatCurrency(calculations.break_even_price)}</span>
          <span className="metric-sub">Minimum to cover all costs</span>
        </div>
      </div>

      {/* Fee Breakdown Chart */}
      <div className="chart-section">
        <h3>Where Your Money Goes</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Projections */}
      {monthly.units > 0 && (
        <div className="chart-section">
          <h3>Monthly Projections ({monthly.units} units)</h3>
          <div className="monthly-summary">
            <div className="monthly-stat">
              <span>Revenue</span>
              <strong>{formatCurrency(monthly.revenue)}</strong>
            </div>
            <div className="monthly-stat">
              <span>Total Costs</span>
              <strong className="negative">{formatCurrency(monthly.costs)}</strong>
            </div>
            <div className="monthly-stat">
              <span>Net Profit</span>
              <strong className={monthly.profit >= 0 ? 'positive' : 'negative'}>
                {formatCurrency(monthly.profit)}
              </strong>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cost Details Table */}
      <div className="details-section">
        <h3>Detailed Breakdown</h3>
        <table className="details-table">
          <tbody>
            <tr>
              <td>Item Price</td>
              <td>{formatCurrency(input.item_price)}</td>
            </tr>
            <tr>
              <td>Sales Tax ({input.tax_rate}%)</td>
              <td>+ {formatCurrency(calculations.sales_tax)}</td>
            </tr>
            <tr className="subtotal">
              <td>Customer Pays</td>
              <td>{formatCurrency(calculations.total_charged)}</td>
            </tr>
            <tr>
              <td>Cost of Goods</td>
              <td>- {formatCurrency(input.cost_of_goods)}</td>
            </tr>
            <tr>
              <td>Shipping Cost</td>
              <td>- {formatCurrency(input.shipping_cost)}</td>
            </tr>
            <tr>
              <td>
                {input.processor} Fee ({calculations.processor_fees.percent_rate}% +{' '}
                {formatCurrency(calculations.processor_fees.fixed_rate)})
              </td>
              <td>- {formatCurrency(calculations.processor_fees.total_fee)}</td>
            </tr>
            <tr className="total">
              <td>Net Profit</td>
              <td className={isProfit ? 'positive' : 'negative'}>
                {formatCurrency(calculations.net_profit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tips */}
      {!isProfit && (
        <div className="tip warning">
          <strong>Warning:</strong> You&apos;re losing money on this sale! Consider raising your
          price to at least {formatCurrency(calculations.break_even_price)} to break even.
        </div>
      )}

      {isProfit && calculations.profit_margin < 20 && (
        <div className="tip info">
          <strong>Tip:</strong> Your profit margin is below 20%. To achieve a 30% margin, consider
          pricing at {formatCurrency(input.cost_of_goods / 0.7 + input.shipping_cost)}.
        </div>
      )}
    </div>
  )
}

export default Results
