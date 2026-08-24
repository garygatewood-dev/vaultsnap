import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { FREE_TIER_PHOTO_LIMIT } from '../lib/subscription'

const FEATURES = [
  {
    title: 'Locked, just for you',
    body: 'Sign in, then unlock again with Face ID, Touch ID, or a PIN. Your vault stays closed until you open it.',
  },
  {
    title: 'Organize effortlessly',
    body: 'Sort photos into albums, mark favorites, and search by filename to find anything in seconds.',
  },
  {
    title: 'AI Enhance ✨',
    body: 'Sharpen old or blurry photos and restore faces with one tap — powered by AI, included with Premium.',
  },
  {
    title: 'Download anywhere',
    body: "Save any photo straight back to your phone's photo library or your computer, whenever you want it.",
  },
]

const PLANS = [
  { id: 'annual', name: 'Annual', price: '$39.99/yr', sub: 'Just $3.33/mo — best value', highlight: true },
  { id: 'monthly', name: 'Monthly', price: '$6.99/mo', sub: 'Billed monthly' },
]

export default function Landing() {
  const { user, loading } = useAuth()

  // Signed-in visitors don't need the pitch — send them straight to their vault.
  if (!loading && user) return <Navigate to="/vault" replace />

  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">VaultSnap</span>
        <Link to="/login" className="landing-nav-login">
          Log in
        </Link>
      </header>

      <section className="landing-hero">
        <h1>Your photos, private and protected.</h1>
        <p>
          VaultSnap is a locked-down photo vault with albums, favorites, and AI-powered enhancement — so your
          memories stay organized, safe, and always yours.
        </p>
        <div className="landing-hero-actions">
          <Link to="/login?mode=signup" className="landing-cta">
            Get started free
          </Link>
          <span className="landing-hero-sub">{FREE_TIER_PHOTO_LIMIT} photos free — no credit card required</span>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div className="landing-feature-card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="landing-pricing">
        <h2>Simple pricing</h2>
        <p className="landing-pricing-sub">
          Start free with {FREE_TIER_PHOTO_LIMIT} photos. Upgrade anytime for unlimited storage and AI enhancement,
          with a 2-day free trial.
        </p>
        <div className="paywall-plans landing-plans">
          {PLANS.map((p) => (
            <div className={`paywall-plan ${p.highlight ? 'selected' : ''}`} key={p.id}>
              {p.highlight && <span className="paywall-badge">Best value</span>}
              <span className="paywall-plan-name">{p.name}</span>
              <span className="paywall-plan-price">{p.price}</span>
              <span className="paywall-plan-sub">{p.sub}</span>
            </div>
          ))}
        </div>
        <Link to="/login?mode=signup" className="landing-cta">
          Start your free trial
        </Link>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} VaultSnap</span>
      </footer>
    </div>
  )
}
