import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { verifyVaultPin } from '../lib/vaultPin'
import { isPlatformAuthenticatorAvailable, unlockWithBiometric } from '../lib/webauthn'

export default function PinEntryForm({ userId, webauthnCredentialId, onUnlock }) {
  const { signOut } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setBiometricAvailable)
  }, [])

  useEffect(() => {
    if (webauthnCredentialId && biometricAvailable) {
      attemptBiometric()
    }
    // Only re-run when the credential/availability actually change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webauthnCredentialId, biometricAvailable])

  async function attemptBiometric() {
    try {
      const success = await unlockWithBiometric(webauthnCredentialId)
      if (success) onUnlock()
    } catch {
      // Cancelled, unavailable, or no matching credential on this device — fall back to PIN.
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
      {webauthnCredentialId && biometricAvailable && (
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
