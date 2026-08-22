import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getVaultPinRecord } from '../lib/vaultPin'
import { listWebauthnCredentialIds } from '../lib/webauthnCredentials'
import PinSetupForm from './PinSetupForm'
import PinEntryForm from './PinEntryForm'

export default function VaultLock({ children }) {
  const { user } = useAuth()
  const [status, setStatus] = useState('loading') // loading | needs-setup | locked | unlocked
  const [webauthnCredentialIds, setWebauthnCredentialIds] = useState([])

  const loadPinRecord = useCallback(async () => {
    const record = await getVaultPinRecord(user.id)
    if (!record?.pin_hash) {
      setStatus('needs-setup')
      setWebauthnCredentialIds([])
    } else {
      setWebauthnCredentialIds(await listWebauthnCredentialIds(user.id))
      setStatus('locked')
    }
  }, [user.id])

  useEffect(() => {
    loadPinRecord()
  }, [loadPinRecord])

  // Re-lock the moment the app is backgrounded, however briefly — no idle grace period.
  // Deliberately not using blur/focus: those also fire for the native file picker
  // (Phase 3's upload button), which would re-lock mid-upload.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        setStatus((current) => (current === 'unlocked' ? 'locked' : current))
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  if (status === 'loading') return null

  if (status === 'needs-setup') {
    return (
      <PinSetupForm
        userId={user.id}
        userEmail={user.email}
        onComplete={(credentialId) => {
          setWebauthnCredentialIds(credentialId ? [credentialId] : [])
          setStatus('unlocked')
        }}
      />
    )
  }

  if (status === 'locked') {
    return (
      <PinEntryForm
        userId={user.id}
        webauthnCredentialIds={webauthnCredentialIds}
        onUnlock={() => setStatus('unlocked')}
      />
    )
  }

  return children
}
