import { useState } from 'react'
import { createCheckoutSession } from '../lib/subscription'

const PLANS = [
  { id: 'annual', name: 'Annual', price: '$39.99/yr', sub: 'Just $3.33/mo — best value', highlight: true },
  { id: 'monthly', name: 'Monthly', price: '$6.99/mo', sub: 'Billed monthly' },
]

export default function PaywallScreen({ reason, dismissible = false, onDismiss }) {
  const [plan, setPlan] = useState('annual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubscribe() {
    setError(null)
    setLoading(true)
    try {
      const url = await createCheckoutSession(plan)
      window.location.href = url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="paywall-overlay">
      <div className="paywall-card">
        {dismissible && (
          <button type="button" className="paywall-dismiss" onClick={onDismiss} aria-label="Close">
            ×
          </button>
        )}
        <h1>VaultSnap Premium</h1>
        <p>{reason || 'Unlock unlimited photos with a 2-day free trial.'}</p>

        <div className="paywall-plans">
          {PLANS.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`paywall-plan ${plan === p.id ? 'selected' : ''}`}
              onClick={() => setPlan(p.id)}
            >
              {p.highlight && <span className="paywall-badge">Best value</span>}
              <span className="paywall-plan-name">{p.name}</span>
              <span className="paywall-plan-price">{p.price}</span>
              <span className="paywall-plan-sub">{p.sub}</span>
            </button>
          ))}
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="button" onClick={handleSubscribe} disabled={loading}>
          {loading ? 'Redirecting…' : 'Start 2-day free trial'}
        </button>
      </div>
    </div>
  )
}
