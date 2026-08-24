import { addWebauthnCredential, listWebauthnCredentialIds } from './webauthnCredentials'

// How long we wait for a biometric attempt before giving up and handing control
// back to the visible PIN form. Some browsers (notably iOS Safari) show a native,
// screen-covering "looking for a passkey" sheet even when allowCredentials has no
// match on this device, and can be slow to resolve on their own — this is what
// makes the PIN fallback actually feel reachable instead of stuck behind that sheet.
const UNLOCK_ATTEMPT_TIMEOUT_MS = 8000

// WebAuthn credentials are permanently bound to whichever rp.id they were
// created under. Pinning this explicitly (instead of letting the browser
// default to the current origin) means credentials keep working even if the
// app is later served from a different subdomain, and — more importantly —
// makes it obvious in code that a credential registered under one domain
// will never match on another. If MyVaultSnap's primary domain ever changes,
// every user will need to re-register biometric unlock.
const RP_ID = 'myvaultsnap.com'

export async function isPlatformAuthenticatorAvailable() {
  if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function guessDeviceLabel() {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Android device'
  if (/Macintosh/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  return null
}

export async function registerBiometricUnlock(userId, userEmail) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const existingIds = await listWebauthnCredentialIds(userId)

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { id: RP_ID, name: 'MyVaultSnap' },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userEmail,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      // Stops this device's authenticator from creating a redundant second
      // credential if it already holds one of these — e.g. tapping "Add this
      // device" again on a device that's already registered.
      excludeCredentials: existingIds.map((id) => ({ id: base64urlToBuffer(id), type: 'public-key' })),
      timeout: 60000,
      attestation: 'none',
    },
  })

  if (!credential) throw new Error('Biometric registration was cancelled')

  await addWebauthnCredential(userId, credential.id, guessDeviceLabel())
  return credential.id
}

export async function unlockWithBiometric(credentialIds) {
  if (!credentialIds?.length) return false

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), UNLOCK_ATTEMPT_TIMEOUT_MS)

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const assertion = await navigator.credentials.get({
      signal: controller.signal,
      publicKey: {
        challenge,
        rpId: RP_ID,
        allowCredentials: credentialIds.map((id) => ({ id: base64urlToBuffer(id), type: 'public-key' })),
        userVerification: 'required',
        timeout: UNLOCK_ATTEMPT_TIMEOUT_MS,
      },
    })
    return Boolean(assertion)
  } finally {
    clearTimeout(timeoutId)
  }
}

function base64urlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
