import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { parseCsv } from '../csvParse'
import { analyzeTransactions } from '../analyze'
import { PROCESSOR_LIST } from '../processors'
import { formatCurrency } from '../format'

const NONE = ''

// Guess which header maps to a field, by name.
function guessColumn(headers, regex) {
  const idx = headers.findIndex((h) => regex.test(h))
  return idx === -1 ? NONE : String(idx)
}

function parseAmount(raw) {
  if (raw == null) return NaN
  return parseFloat(String(raw).replace(/[^0-9.-]/g, ''))
}

function normalizeType(raw) {
  const s = String(raw || '').toLowerCase()
  if (/online|not present|ecom|keyed|invoice/.test(s)) return 'online'
  if (/person|present|swipe|chip|tap|terminal|card/.test(s)) return 'in_person'
  return undefined
}

function ImportAnalysis({ currency = 'USD', defaultProcessor = 'stripe' }) {
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [mapping, setMapping] = useState({ amount: NONE, fee: NONE, type: NONE })
  const [processor, setProcessor] = useState(defaultProcessor)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  const reset = () => {
    setHeaders([])
    setRows([])
    setAnalysis(null)
    setMapping({ amount: NONE, fee: NONE, type: NONE })
  }

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setError(null)
    setAnalysis(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const { headers: hdrs, rows: rws } = parseCsv(String(reader.result))
      if (hdrs.length === 0 || rws.length === 0) {
        reset()
        setError('That file has no rows we can read. Export a transactions CSV and try again.')
        return
      }
      setHeaders(hdrs)
      setRows(rws)
      setMapping({
        amount: guessColumn(hdrs, /amount|total|gross|net|sale|price/i),
        fee: guessColumn(hdrs, /fee|processing|charge/i),
        type: guessColumn(hdrs, /type|method|entry|present/i),
      })
    }
    reader.onerror = () => setError('Could not read that file.')
    reader.readAsText(file)
  }

  const runAnalysis = () => {
    const amountIdx = parseInt(mapping.amount, 10)
    const feeIdx = mapping.fee === NONE ? -1 : parseInt(mapping.fee, 10)
    const typeIdx = mapping.type === NONE ? -1 : parseInt(mapping.type, 10)

    const txns = rows.map((r) => {
      const txn = { amount: parseAmount(r[amountIdx]) }
      if (feeIdx >= 0) {
        const fee = parseAmount(r[feeIdx])
        if (Number.isFinite(fee)) txn.fee = Math.abs(fee)
      }
      if (typeIdx >= 0) {
        const t = normalizeType(r[typeIdx])
        if (t) txn.type = t
      }
      return txn
    })

    const result = analyzeTransactions(txns, { processor })
    if (!result) {
      setAnalysis(null)
      setError('No valid transaction amounts found. Check the Amount column mapping.')
      return
    }
    setError(null)
    setAnalysis(result)
  }

  const hasFile = headers.length > 0
  const canAnalyze = hasFile && mapping.amount !== NONE

  return (
    <div className="import-view">
      <div className="card">
        <div className="card-header">
          <h2>Import Sales &amp; Find Your Effective Rate</h2>
        </div>

        {!hasFile && !error && (
          <div className="empty-state-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
            </svg>
            <h3>Upload a sales export</h3>
            <p>
              Export a transactions CSV from Square, Toast, or Clover. It is processed entirely in
              your browser and never uploaded anywhere.
            </p>
          </div>
        )}

        <div className="settings-group">
          <label htmlFor="import-file">Sales CSV</label>
          <input id="import-file" type="file" accept=".csv,text/csv" onChange={handleFile} />
          {fileName && <span className="hint">{fileName}</span>}
        </div>

        {error && <div className="error-message">{error}</div>}

        {hasFile && (
          <>
            <div className="settings-section">
              <h3>Map your columns</h3>
              <div className="settings-group">
                <label htmlFor="map-amount">Amount column (required)</label>
                <select
                  id="map-amount"
                  value={mapping.amount}
                  onChange={(e) => setMapping((m) => ({ ...m, amount: e.target.value }))}
                >
                  <option value={NONE}>— select —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={String(i)}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="settings-group">
                <label htmlFor="map-fee">Fee column (optional)</label>
                <select
                  id="map-fee"
                  value={mapping.fee}
                  onChange={(e) => setMapping((m) => ({ ...m, fee: e.target.value }))}
                >
                  <option value={NONE}>— estimate from rates —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={String(i)}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              {mapping.fee === NONE && (
                <div className="settings-group">
                  <label htmlFor="map-processor">Estimate fees as</label>
                  <select
                    id="map-processor"
                    value={processor}
                    onChange={(e) => setProcessor(e.target.value)}
                  >
                    {PROCESSOR_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button className="btn-primary" onClick={runAnalysis} disabled={!canAnalyze}>
              Analyze
            </button>
          </>
        )}
      </div>

      {analysis && (
        <div className="card">
          <div className="card-header">
            <h2>Effective Rate</h2>
            {analysis.feesEstimated && <span className="card-badge">Estimated</span>}
          </div>

          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-value">{analysis.effectiveRate.toFixed(2)}%</span>
                <span className="stat-label">Effective rate</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-value">{formatCurrency(analysis.totalFees, currency)}</span>
                <span className="stat-label">Total fees</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-value">{formatCurrency(analysis.totalVolume, currency)}</span>
                <span className="stat-label">Card volume</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-value">
                  {formatCurrency(analysis.averageTicket, currency)}
                </span>
                <span className="stat-label">Avg ticket ({analysis.count} txns)</span>
              </div>
            </div>
          </div>

          {analysis.smallTicketDrag.count > 0 && (
            <div className="tip info">
              <strong>Small-ticket drag:</strong> {analysis.smallTicketDrag.count} sales at or under{' '}
              {formatCurrency(analysis.smallTicketDrag.threshold, currency)} pay an effective{' '}
              {analysis.smallTicketDrag.effectiveRate.toFixed(2)}% — fixed per-transaction fees hit
              small tickets hardest.
            </div>
          )}

          <div className="chart-section">
            <h3>Ticket size distribution</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analysis.ticketBuckets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {analysis.feesEstimated && (
            <p className="hint">
              Fees were estimated from published rates because your file had no fee column. Map a
              fee column for exact numbers.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default ImportAnalysis
