import { useEffect, useState } from 'react'
import { setupVaultPin } from '../lib/vaultPin'
import { isPlatformAuthenticatorAvailable, registerBiometricUnlock } from '../lib/webauthn'

export default function PinSetupForm({ userId, userEmail, onComplete }) {
  const [step, setStep] = useState('pin') // pin | biometric
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setBiometricAvailable)
  }, [])

  async function handlePinSubmit(e) {
    e.preventDefault()
    setError(null)

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.')
      return
    }
    if (pin !== confirmPin) {
      setError('PINs do not match.')
      return
    }

    setSubmitting(true)
    try {
      await setupVaultPin(userId, pin)
      setStep(biometricAvailable ? 'biometric' : 'done')
      if (!biometricAvailable) onComplete(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEnableBiometric() {
    setError(null)
    try {
      const credentialId = await registerBiometricUnlock(userId, userEmail)
      onComplete(credentialId)
    } catch (err) {
      setError(`Could not enable Face ID / Touch ID: ${err.message}`)
    }
  }

  if (step === 'biometric') {
    return (
      <main className="lock-screen">
        <h1>Enable biometric unlock?</h1>
        <p>Use Face ID / Touch ID to unlock your vault instead of typing your PIN.</p>
        {error && <p role="alert">{error}</p>}
        <button type="button" onClick={handleEnableBiometric}>
          Enable Face ID / Touch ID
        </button>
        <button type="button" onClick={() => onComplete(null)}>
          Skip for now
        </button>
      </main>
    )
  }

  return (
    <main className="lock-screen">
      <h1>Set up your vault PIN</h1>
      <p>This PIN protects your vault every time you open or return to the app.</p>
      <form onSubmit={handlePinSubmit}>
        <label>
          PIN
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            minLength={4}
            maxLength={12}
            required
            autoFocus
          />
        </label>
        <label>
          Confirm PIN
          <input
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            minLength={4}
            maxLength={12}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Set PIN'}
        </button>
      </form>
    </main>
  )
}
