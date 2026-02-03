import { useState } from 'react'

const PROCESSORS = [
  { id: 'stripe', name: 'Stripe', description: '2.9% + $0.30 online' },
  { id: 'toast', name: 'Toast', description: '2.99% + $0.15 online' },
]

const TRANSACTION_TYPES = [
  { id: 'online', name: 'Online / Card Not Present' },
  { id: 'in_person', name: 'In-Person / Card Present' },
]

function Calculator({ onCalculate, loading }) {
  const [formData, setFormData] = useState({
    item_price: '',
    cost_of_goods: '',
    shipping_cost: '',
    tax_rate: '',
    processor: 'stripe',
    transaction_type: 'online',
    monthly_units: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const data = {
      item_price: parseFloat(formData.item_price) || 0,
      cost_of_goods: parseFloat(formData.cost_of_goods) || 0,
      shipping_cost: parseFloat(formData.shipping_cost) || 0,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      processor: formData.processor,
      transaction_type: formData.transaction_type,
      monthly_units: parseInt(formData.monthly_units) || 0,
    }

    onCalculate(data)
  }

  return (
    <form className="calculator" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Sale Details</h2>

        <div className="form-group">
          <label htmlFor="item_price">Selling Price ($)</label>
          <input
            type="number"
            id="item_price"
            name="item_price"
            value={formData.item_price}
            onChange={handleChange}
            placeholder="29.99"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cost_of_goods">Cost of Goods ($)</label>
          <input
            type="number"
            id="cost_of_goods"
            name="cost_of_goods"
            value={formData.cost_of_goods}
            onChange={handleChange}
            placeholder="10.00"
            step="0.01"
            min="0"
            required
          />
          <span className="hint">Your cost to acquire or make the item</span>
        </div>

        <div className="form-group">
          <label htmlFor="shipping_cost">Shipping Cost ($)</label>
          <input
            type="number"
            id="shipping_cost"
            name="shipping_cost"
            value={formData.shipping_cost}
            onChange={handleChange}
            placeholder="5.00"
            step="0.01"
            min="0"
          />
          <span className="hint">Leave empty or 0 if not applicable</span>
        </div>

        <div className="form-group">
          <label htmlFor="tax_rate">Sales Tax Rate (%)</label>
          <input
            type="number"
            id="tax_rate"
            name="tax_rate"
            value={formData.tax_rate}
            onChange={handleChange}
            placeholder="5.5"
            step="0.01"
            min="0"
            max="100"
          />
          <span className="hint">Maine: 5.5%, varies by state</span>
        </div>
      </div>

      <div className="form-section">
        <h2>Payment Processing</h2>

        <div className="form-group">
          <label>Payment Processor</label>
          <div className="radio-group">
            {PROCESSORS.map((proc) => (
              <label key={proc.id} className="radio-label">
                <input
                  type="radio"
                  name="processor"
                  value={proc.id}
                  checked={formData.processor === proc.id}
                  onChange={handleChange}
                />
                <span className="radio-text">
                  <strong>{proc.name}</strong>
                  <small>{proc.description}</small>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Transaction Type</label>
          <div className="radio-group">
            {TRANSACTION_TYPES.map((type) => (
              <label key={type.id} className="radio-label">
                <input
                  type="radio"
                  name="transaction_type"
                  value={type.id}
                  checked={formData.transaction_type === type.id}
                  onChange={handleChange}
                />
                <span className="radio-text">{type.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>Monthly Projections (Optional)</h2>

        <div className="form-group">
          <label htmlFor="monthly_units">Units Sold Per Month</label>
          <input
            type="number"
            id="monthly_units"
            name="monthly_units"
            value={formData.monthly_units}
            onChange={handleChange}
            placeholder="100"
            min="0"
          />
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Profit'}
      </button>
    </form>
  )
}

export default Calculator
