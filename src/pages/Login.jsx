import { useState } from 'react'
import { Navigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { user, signIn, signUp, resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  // Landing page's "Get started free" CTA links here with ?mode=signup so
  // visitors land straight on the signup form instead of having to toggle.
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/vault" replace />

  function switchMode(nextMode) {
    setMode(nextMode)
    setError(null)
    setInfo(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'reset') {
      const { error: resetError } = await resetPassword(email)
      setSubmitting(false)
      if (resetError) {
        setError(resetError.message)
        return
      }
      // Supabase doesn't reveal whether an account exists for this email —
      // this message stays the same either way so we don't leak that.
      setInfo("If an account exists for that email, we've sent a link to reset your password.")
      return
    }

    const { error: authError } =
      mode === 'signin' ? await signIn(email, password) : await signUp(email, password)

    setSubmitting(false)

    if (authError) {
      setError(authError.message)
      return
    }

    if (mode === 'signup') {
      setInfo('Check your email to confirm your account.')
    }
  }

  return (
    <main>
      <Link to="/" className="login-back-link">
        ← MyVaultSnap
      </Link>
      <h1>{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create your account' : 'Reset your password'}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        {mode !== 'reset' && (
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
        )}

        {error && <p role="alert">{error}</p>}
        {info && <p role="status">{info}</p>}

        <button type="submit" disabled={submitting}>
          {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Sign up' : 'Send reset link'}
        </button>
      </form>

      {mode === 'signin' && (
        <button type="button" onClick={() => switchMode('reset')}>
          Forgot password?
        </button>
      )}

      {mode === 'reset' ? (
        <button type="button" onClick={() => switchMode('signin')}>
          Back to sign in
        </button>
      ) : (
        <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      )}
    </main>
  )
}
