import { useState } from 'react'

function OnboardingModal({ initial, onComplete }) {
  const [businessName, setBusinessName] = useState(
    initial.businessName === 'Your Business' ? '' : initial.businessName
  )
  const [defaultTaxRate, setDefaultTaxRate] = useState(String(initial.defaultTaxRate))
  const [defaultProcessor, setDefaultProcessor] = useState(initial.defaultProcessor)

  const handleSubmit = (e) => {
    e.preventDefault()
    onComplete({
      businessName: businessName.trim() || 'Your Business',
      defaultTaxRate: parseFloat(defaultTaxRate) || 0,
      defaultProcessor,
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Welcome</h2>
        <p>Let&apos;s set up your calculator. You can change everything later in Settings.</p>
        <form onSubmit={handleSubmit}>
          <div className="settings-group">
            <label htmlFor="ob-name">Business Name</label>
            <input
              id="ob-name"
              type="text"
              placeholder="Your Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="settings-group">
            <label htmlFor="ob-tax">Default Sales Tax Rate (%)</label>
            <input
              id="ob-tax"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="5.5"
              value={defaultTaxRate}
              onChange={(e) => setDefaultTaxRate(e.target.value)}
            />
          </div>
          <div className="settings-group">
            <label htmlFor="ob-proc">Preferred Payment Processor</label>
            <select
              id="ob-proc"
              value={defaultProcessor}
              onChange={(e) => setDefaultProcessor(e.target.value)}
            >
              <option value="stripe">Stripe</option>
              <option value="toast">Toast</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Get Started
          </button>
        </form>
      </div>
    </div>
  )
}

export default OnboardingModal
