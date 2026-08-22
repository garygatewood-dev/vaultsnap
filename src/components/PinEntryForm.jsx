import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { verifyVaultPin } from '../lib/vaultPin'
import { isPlatformAuthenticatorAvailable, unlockWithBiometric } from '../lib/webauthn'

export default function PinEntryForm({ userId, webauthnCredentialIds, onUnlock }) {
  const { signOut } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  const hasBiometricCredentials = webauthnCredentialIds?.length > 0

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setBiometricAvailable)
  }, [])

  useEffect(() => {
    if (hasBiometricCredentials && biometricAvailable) {
      attemptBiometric()
    }
    // Only re-run when the credentials/availability actually change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webauthnCredentialIds, biometricAvailable])

  async function attemptBiometric() {
    try {
      const success = await unlockWithBiometric(webauthnCredentialIds)
      if (success) onUnlock()
    } catch {
      // Cancelled, unavailable, timed out, or no matching credential on this
      // device — fall back to PIN, which is already visible below.
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const valid = await verifyVaultPin(userId, pin)
      if (valid) {
        onUnlock()
      } else {
        setError('Incorrect PIN.')
        setPin('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="lock-screen">
      <h1>Vault locked</h1>
      {hasBiometricCredentials && biometricAvailable && (
        <button type="button" onClick={attemptBiometric}>
          Unlock with Face ID / Touch ID
        </button>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Enter PIN
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          Unlock
        </button>
      </form>
      <button type="button" onClick={() => signOut()}>
        Sign out
      </button>
    </main>
  )
}
