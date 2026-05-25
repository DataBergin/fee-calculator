import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { computeInsights } from '../insights'
import { formatCurrency } from '../format'

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#ef4444', '#0ea5e9']

function Insights({ history, currency = 'USD', onStart }) {
  const insights = computeInsights(history)

  if (!insights) {
    return (
      <div className="card">
        <div className="empty-state-large">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3>No Insights Yet</h3>
          <p>Run a few calculations and your trends will show up here.</p>
          <button className="btn-primary" onClick={onStart}>
            Start Calculating
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="insights-grid">
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{insights.avgMargin.toFixed(1)}%</span>
            <span className="stat-label">Average Margin</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(insights.totalFees, currency)}</span>
            <span className="stat-label">Total Fees (est.)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(insights.totalProfit, currency)}</span>
            <span className="stat-label">Total Net Profit</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{insights.count}</span>
            <span className="stat-label">Calculations</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Margin Trend</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={insights.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line type="monotone" dataKey="margin" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Fee Burden by Processor</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={insights.feeByProcessor}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {insights.feeByProcessor.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card best-worst">
          <div className="card-header">
            <h3>Best Margin</h3>
          </div>
          <p className="bw-value positive">{insights.best.margin.toFixed(1)}%</p>
          <p className="bw-meta">
            {formatCurrency(insights.best.price, currency)} sale via {insights.best.processor}
          </p>
        </div>
        <div className="card best-worst">
          <div className="card-header">
            <h3>Worst Margin</h3>
          </div>
          <p className={`bw-value ${insights.worst.margin >= 0 ? 'positive' : 'negative'}`}>
            {insights.worst.margin.toFixed(1)}%
          </p>
          <p className="bw-meta">
            {formatCurrency(insights.worst.price, currency)} sale via {insights.worst.processor}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Insights
