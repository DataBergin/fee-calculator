import { useState, useEffect } from 'react'
import Calculator from './components/Calculator'
import Results from './components/Results'
import Insights from './components/Insights'
import OnboardingModal from './components/OnboardingModal'
import { formatCurrency } from './format'
import { historyToCsv, calculationToCsv, downloadCsv } from './csv'
import { darken } from './color'
import { loadSettings, saveSettings, resolveTheme, initialsFor } from './settings'

function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('calculator')
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 768
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [settings, setSettings] = useState(loadSettings)
  const [draft, setDraft] = useState(settings)
  const [savedFlash, setSavedFlash] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !settings.onboarded)

  const currency = settings.currency

  // Apply the resolved theme to the document and keep it in sync with the OS
  // setting while the preference is 'system'.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveTheme(settings.theme))
    if (settings.theme !== 'system' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () =>
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  // White-label primary color.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--primary', settings.primaryColor)
    root.style.setProperty('--primary-dark', darken(settings.primaryColor, 0.18))
  }, [settings.primaryColor])

  useEffect(() => {
    document.title = `${settings.businessName} — Fee & Profit Calculator`
  }, [settings.businessName])

  const completeOnboarding = (values) => {
    const merged = { ...settings, ...values, onboarded: true }
    setSettings(merged)
    setDraft(merged)
    saveSettings(merged)
    setShowOnboarding(false)
  }

  const exportHistoryCsv = () => downloadCsv('fee-calculator-history.csv', historyToCsv(history))
  const exportCalculationCsv = () => downloadCsv('fee-calculation.csv', calculationToCsv(results))

  const calculateFees = async (formData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Calculation failed')
      }

      setResults(data)

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
      const message =
        err.name === 'TypeError'
          ? 'Could not reach the calculator service. Check your connection and try again.'
          : err.message
      setError(message)
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

  const updateDraft = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setSavedFlash(false)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateDraft('logo', reader.result)
    reader.readAsDataURL(file)
  }

  const handleSaveSettings = () => {
    setSettings(draft)
    saveSettings(draft)
    setSavedFlash(true)
  }

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      item.data.input.processor.toLowerCase().includes(q) ||
      String(item.data.input.item_price).includes(q) ||
      item.timestamp.toLowerCase().includes(q)
    )
  })

  return (
    <div className="dashboard">
      {showOnboarding && <OnboardingModal initial={settings} onComplete={completeOnboarding} />}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              {settings.logo ? (
                <img src={settings.logo} alt={`${settings.businessName} logo`} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
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
              <div className="avatar">{initialsFor(settings.businessName)}</div>
              <div className="user-details">
                <span className="user-name">{settings.businessName}</span>
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
            <button
              className="topbar-menu"
              aria-label="Toggle menu"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
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
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.trim()) setActiveTab('history')
                }}
              />
            </div>
            <span className="topbar-business">{settings.businessName}</span>
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
                      {results ? formatCurrency(results.calculations.net_profit, currency) : '--'}
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
                        ? formatCurrency(results.calculations.processor_fees.total_fee, currency)
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
                    <Calculator
                      onCalculate={calculateFees}
                      loading={loading}
                      defaultTaxRate={settings.defaultTaxRate}
                      defaultProcessor={settings.defaultProcessor}
                    />
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  {results && (
                    <div className="card">
                      <div className="results-toolbar">
                        <button className="btn-secondary" onClick={exportCalculationCsv}>
                          Export CSV
                        </button>
                      </div>
                      <Results data={results} currency={currency} />
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
                                {formatCurrency(item.data.input.item_price, currency)} sale
                              </span>
                              <span className="activity-meta">
                                Profit:{' '}
                                {formatCurrency(item.data.calculations.net_profit, currency)}
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
                    <div className="header-actions">
                      <button className="btn-secondary" onClick={exportHistoryCsv}>
                        Export CSV
                      </button>
                      <button className="btn-secondary" onClick={clearHistory}>
                        Clear All
                      </button>
                    </div>
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
                ) : filteredHistory.length === 0 ? (
                  <div className="empty-state-large">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3>No matches</h3>
                    <p>No calculations match &ldquo;{searchQuery}&rdquo;.</p>
                    <button className="btn-secondary" onClick={() => setSearchQuery('')}>
                      Clear search
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
                        {filteredHistory.map((item) => (
                          <tr key={item.id}>
                            <td>{item.timestamp}</td>
                            <td>{formatCurrency(item.data.input.item_price, currency)}</td>
                            <td>{item.data.input.processor}</td>
                            <td className="negative">
                              -{' '}
                              {formatCurrency(
                                item.data.calculations.processor_fees.total_fee,
                                currency
                              )}
                            </td>
                            <td
                              className={
                                item.data.calculations.net_profit >= 0 ? 'positive' : 'negative'
                              }
                            >
                              {formatCurrency(item.data.calculations.net_profit, currency)}
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
              <Insights
                history={history}
                currency={currency}
                onStart={() => setActiveTab('calculator')}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-view">
              <div className="card">
                <div className="card-header">
                  <h2>Settings</h2>
                  {savedFlash && <span className="card-badge saved-flash">Saved</span>}
                </div>
                <div className="settings-section">
                  <h3>Business Profile</h3>
                  <div className="settings-group">
                    <label htmlFor="set-business-name">Business Name</label>
                    <input
                      id="set-business-name"
                      type="text"
                      placeholder="Your Business Name"
                      value={draft.businessName}
                      onChange={(e) => updateDraft('businessName', e.target.value)}
                    />
                  </div>
                  <div className="settings-group">
                    <label htmlFor="set-tax-rate">Default Tax Rate (%)</label>
                    <input
                      id="set-tax-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="5.5"
                      value={draft.defaultTaxRate}
                      onChange={(e) => updateDraft('defaultTaxRate', e.target.value)}
                    />
                  </div>
                  <div className="settings-group">
                    <label htmlFor="set-processor">Preferred Processor</label>
                    <select
                      id="set-processor"
                      value={draft.defaultProcessor}
                      onChange={(e) => updateDraft('defaultProcessor', e.target.value)}
                    >
                      <option value="stripe">Stripe</option>
                      <option value="toast">Toast</option>
                      <option value="square">Square</option>
                      <option value="clover">Clover</option>
                    </select>
                  </div>
                  <div className="settings-group">
                    <label htmlFor="set-currency">Currency</label>
                    <select
                      id="set-currency"
                      value={draft.currency}
                      onChange={(e) => updateDraft('currency', e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
                <div className="settings-section">
                  <h3>Branding &amp; Appearance</h3>
                  <div className="settings-group">
                    <label htmlFor="set-theme">Theme</label>
                    <select
                      id="set-theme"
                      value={draft.theme}
                      onChange={(e) => updateDraft('theme', e.target.value)}
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  <div className="settings-group">
                    <label htmlFor="set-color">Primary Color</label>
                    <input
                      id="set-color"
                      type="color"
                      className="color-input"
                      value={draft.primaryColor}
                      onChange={(e) => updateDraft('primaryColor', e.target.value)}
                    />
                  </div>
                  <div className="settings-group">
                    <label htmlFor="set-logo">Logo</label>
                    <div className="logo-upload">
                      {draft.logo && (
                        <img className="logo-preview" src={draft.logo} alt="Logo preview" />
                      )}
                      <input
                        id="set-logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      {draft.logo && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => updateDraft('logo', '')}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button className="btn-primary" onClick={handleSaveSettings}>
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
