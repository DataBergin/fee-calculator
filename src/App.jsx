import { useState } from 'react'
import Calculator from './components/Calculator'
import Results from './components/Results'

function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('calculator')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const calculateFees = async (formData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Calculation failed')
      }

      const data = await response.json()
      setResults(data)

      // Add to history
      setHistory((prev) =>
        [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            data: data,
          },
          ...prev,
        ].slice(0, 10)
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (item) => {
    setResults(item.data)
    setActiveTab('calculator')
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {sidebarOpen && <span>FeeCalc</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? (
                <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {sidebarOpen && <span>Calculator</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {sidebarOpen && <span>History</span>}
            {history.length > 0 && <span className="badge">{history.length}</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {sidebarOpen && <span>Insights</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {sidebarOpen && <span>Settings</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="avatar">JB</div>
              <div className="user-details">
                <span className="user-name">Jack&apos;s Cafe</span>
                <span className="user-plan">Free Plan</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>
              {activeTab === 'calculator' && 'Fee Calculator'}
              {activeTab === 'history' && 'Calculation History'}
              {activeTab === 'insights' && 'Business Insights'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
          <div className="topbar-right">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search..." />
            </div>
            <button className="icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {activeTab === 'calculator' && (
            <div className="calculator-view">
              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{history.length}</span>
                    <span className="stat-label">Calculations</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {results ? `$${results.calculations.net_profit.toFixed(2)}` : '--'}
                    </span>
                    <span className="stat-label">Last Profit</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {results ? `${results.calculations.profit_margin.toFixed(1)}%` : '--'}
                    </span>
                    <span className="stat-label">Margin</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {results
                        ? `$${results.calculations.processor_fees.total_fee.toFixed(2)}`
                        : '--'}
                    </span>
                    <span className="stat-label">Last Fee</span>
                  </div>
                </div>
              </div>

              {/* Calculator Grid */}
              <div className="dashboard-grid">
                <div className="grid-main">
                  <div className="card">
                    <div className="card-header">
                      <h2>New Calculation</h2>
                      <span className="card-badge">Quick Calc</span>
                    </div>
                    <Calculator onCalculate={calculateFees} loading={loading} />
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  {results && (
                    <div className="card">
                      <Results data={results} />
                    </div>
                  )}
                </div>

                <div className="grid-side">
                  {/* Recent Activity */}
                  <div className="card">
                    <div className="card-header">
                      <h3>Recent Activity</h3>
                    </div>
                    <div className="activity-list">
                      {history.length === 0 ? (
                        <p className="empty-state">No calculations yet</p>
                      ) : (
                        history.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="activity-item"
                            onClick={() => loadFromHistory(item)}
                          >
                            <div className="activity-icon">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="activity-details">
                              <span className="activity-title">
                                ${item.data.input.item_price.toFixed(2)} sale
                              </span>
                              <span className="activity-meta">
                                Profit: ${item.data.calculations.net_profit.toFixed(2)}
                              </span>
                            </div>
                            <span className="activity-time">{item.timestamp.split(',')[1]}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="card tips-card">
                    <div className="card-header">
                      <h3>Quick Tips</h3>
                    </div>
                    <div className="tips-list">
                      <div className="tip-item">
                        <span className="tip-icon">💡</span>
                        <p>In-person transactions have lower fees than online.</p>
                      </div>
                      <div className="tip-item">
                        <span className="tip-icon">📊</span>
                        <p>Aim for at least 30% margin to stay healthy.</p>
                      </div>
                      <div className="tip-item">
                        <span className="tip-icon">🎯</span>
                        <p>Use break-even price as your absolute minimum.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-view">
              <div className="card">
                <div className="card-header">
                  <h2>Calculation History</h2>
                  {history.length > 0 && (
                    <button className="btn-secondary" onClick={clearHistory}>
                      Clear All
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="empty-state-large">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3>No History Yet</h3>
                    <p>Your calculations will appear here</p>
                    <button className="btn-primary" onClick={() => setActiveTab('calculator')}>
                      Start Calculating
                    </button>
                  </div>
                ) : (
                  <div className="history-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Item Price</th>
                          <th>Processor</th>
                          <th>Fee</th>
                          <th>Net Profit</th>
                          <th>Margin</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <tr key={item.id}>
                            <td>{item.timestamp}</td>
                            <td>${item.data.input.item_price.toFixed(2)}</td>
                            <td>{item.data.input.processor}</td>
                            <td className="negative">
                              -${item.data.calculations.processor_fees.total_fee.toFixed(2)}
                            </td>
                            <td
                              className={
                                item.data.calculations.net_profit >= 0 ? 'positive' : 'negative'
                              }
                            >
                              ${item.data.calculations.net_profit.toFixed(2)}
                            </td>
                            <td>{item.data.calculations.profit_margin.toFixed(1)}%</td>
                            <td>
                              <button className="btn-icon" onClick={() => loadFromHistory(item)}>
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="insights-view">
              <div className="card">
                <div className="empty-state-large">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3>Business Insights Coming Soon</h3>
                  <p>Track trends, compare processors, and optimize your pricing.</p>
                  <span className="coming-soon-badge">Coming Soon</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-view">
              <div className="card">
                <div className="card-header">
                  <h2>Settings</h2>
                </div>
                <div className="settings-section">
                  <h3>Business Profile</h3>
                  <div className="settings-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      placeholder="Your Business Name"
                      defaultValue="Jack's Cafe"
                    />
                  </div>
                  <div className="settings-group">
                    <label>Default Tax Rate (%)</label>
                    <input type="number" placeholder="5.5" defaultValue="5.5" />
                  </div>
                  <div className="settings-group">
                    <label>Preferred Processor</label>
                    <select defaultValue="stripe">
                      <option value="stripe">Stripe</option>
                      <option value="toast">Toast</option>
                    </select>
                  </div>
                </div>
                <div className="settings-section">
                  <h3>Appearance</h3>
                  <div className="settings-group">
                    <label>Theme</label>
                    <select defaultValue="light">
                      <option value="light">Light</option>
                      <option value="dark">Dark (Coming Soon)</option>
                    </select>
                  </div>
                </div>
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
