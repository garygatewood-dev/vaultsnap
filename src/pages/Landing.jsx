import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { FREE_TIER_PHOTO_LIMIT } from '../lib/subscription'

const FEATURES = [
  {
    title: 'Photos and video, one vault',
    body: "Upload photos and video straight from your phone's camera or gallery, or from your computer's files. Everything lands in the same private vault.",
  },
  {
    title: 'Phone to computer, and back',
    body: "Snap a photo on your phone and pull it up on your laptop minutes later — or upload from your desktop and grab it from your phone. Your vault goes wherever you do.",
  },
  {
    title: 'AI Enhance ✨',
    body: 'Sharpen old, blurry, or low-res photos and restore faces with one tap — real AI enhancement, not a filter. Included with Premium.',
  },
  {
    title: 'Locked, twice',
    body: "Sign in, then unlock again with Face ID, Touch ID, or a PIN. Your vault stays closed until you open it — even on a device that's already signed in.",
  },
  {
    title: 'Organize and download freely',
    body: "Sort into albums, mark favorites, and download anything back to your device — including straight to your phone's photo library — whenever you want it.",
  },
]

const SECURITY_POINTS = [
  'Every photo is scoped to your account at the database level — genuinely inaccessible to anyone else, not just hidden in the app.',
  'Your vault is locked behind two layers: your account sign-in, then Face ID, Touch ID, or a PIN before anything inside is visible.',
  "No ads, ever. Your photos are never sold, mined, or shared — they're yours.",
]

const FAQS = [
  {
    q: 'Does MyVaultSnap support video, or just photos?',
    a: 'Both. Upload and store video right alongside your photos — no separate app needed.',
  },
  {
    q: 'Can I cancel Premium anytime?',
    a: "Yes. Billing is monthly or annual with no long-term contract, and you can cancel anytime from your account.",
  },
  {
    q: 'What happens to my photos if I cancel?',
    a: "They stay exactly where they are. You keep access to everything already in your vault — you just won't be able to add more than the free 25-photo limit until you resubscribe.",
  },
  {
    q: 'Is AI Enhance available on the free plan?',
    a: "It's included with Premium, along with unlimited photos — you can try it during the 2-day free trial before committing.",
  },
]

const PLANS = [
  { id: 'annual', name: 'Annual', price: '$39.99/yr', sub: 'Just $3.33/mo — best value', highlight: true },
  { id: 'monthly', name: 'Monthly', price: '$6.99/mo', sub: 'Billed monthly' },
]

function LogoMark({ size = 36 }) {
  return (
    <svg
      className="landing-logo-mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#131b2e" />
      <path d="M14 18v-3a6 6 0 0 1 12 0v3" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="11" y="18" width="18" height="14" rx="3" fill="#2dd4bf" />
      <circle cx="20" cy="24" r="2" fill="#131b2e" />
      <rect x="19" y="25" width="2" height="4" rx="1" fill="#131b2e" />
    </svg>
  )
}

export default function Landing() {
  const { user, loading } = useAuth()

  // Signed-in visitors don't need the pitch — send them straight to their vault.
  if (!loading && user) return <Navigate to="/vault" replace />

  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-brand">
          <LogoMark />
          <span className="landing-logo-text">MyVaultSnap</span>
        </span>
        <Link to="/login" className="landing-nav-login">
          Log in
        </Link>
      </header>

      <section className="landing-hero">
        <h1>Your photos and videos, private and protected.</h1>
        <p>
          MyVaultSnap is a locked-down vault for photos and video — upload from your phone or computer, enhance with
          AI, and access from anywhere, all in one place that's genuinely yours.
        </p>
        <div className="landing-hero-actions">
          <Link to="/login?mode=signup" className="landing-cta">
            Get started free
          </Link>
          <span className="landing-hero-sub">{FREE_TIER_PHOTO_LIMIT} photos free — no credit card required</span>
        </div>
      </section>

      <section className="landing-why">
        <h2>Not just another camera roll</h2>
        <p>
          Your phone's default Photos app isn't private — anyone who picks up an unlocked phone can flip through it.
          MyVaultSnap keeps sensitive photos and video in a separate, locked space with its own Face ID, Touch ID, or
          PIN, so they're never just sitting in your everyday camera roll.
        </p>
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div className="landing-feature-card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="landing-security">
        <h2>Built to be private</h2>
        <ul className="landing-security-list">
          {SECURITY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="landing-faq">
        <h2>Questions</h2>
        <div className="landing-faq-list">
          {FAQS.map((item) => (
            <div className="landing-faq-item" key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-pricing">
        <h2>Simple pricing</h2>
        <p className="landing-pricing-sub">
          Start free with {FREE_TIER_PHOTO_LIMIT} photos. Upgrade anytime for unlimited storage and AI enhancement,
          with a 2-day free trial.
        </p>
        <div className="landing-plans">
          {PLANS.map((p) => (
            <div className={`landing-plan ${p.highlight ? 'highlight' : ''}`} key={p.id}>
              {p.highlight && <span className="landing-plan-badge">Best value</span>}
              <span className="landing-plan-name">{p.name}</span>
              <span className="landing-plan-price">{p.price}</span>
              <span className="landing-plan-sub">{p.sub}</span>
            </div>
          ))}
        </div>
        <Link to="/login?mode=signup" className="landing-cta">
          Start your free trial
        </Link>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} MyVaultSnap</span>
        <Link to="/privacy" className="landing-footer-link">
          Privacy Policy
        </Link>
        <Link to="/terms" className="landing-footer-link">
          Terms of Service
        </Link>
      </footer>
    </div>
  )
}
