import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

// Reached via the link in Supabase's "reset password" email. That link
// carries a one-time recovery token in the URL hash; the Supabase client
// picks it up automatically (the same mechanism that already handles signup
// confirmation links) and turns it into a real, temporary session — which is
// why this page can rely on useAuth() rather than handling any token itself.
export default function ResetPassword() {
  const { user, loading, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (done) return <Navigate to="/vault" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    setSubmitting(true)
    const { error: updateError } = await updatePassword(password)
    setSubmitting(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
  }

  if (loading) return null

  if (!user) {
    return (
      <main>
        <Link to="/" className="login-back-link">
          ← MyVaultSnap
        </Link>
        <h1>Link expired</h1>
        <p>
          This password reset link is invalid or has already been used — reset links only work once, and expire
          after a while for security.
        </p>
        <Link to="/login">Request a new reset link</Link>
      </main>
    )
  }

  return (
    <main>
      <Link to="/" className="login-back-link">
        ← MyVaultSnap
      </Link>
      <h1>Choose a new password</h1>
      <form onSubmit={handleSubmit}>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </main>
  )
}
