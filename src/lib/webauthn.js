import { setWebauthnCredentialId } from './vaultPin'

export async function isPlatformAuthenticatorAvailable() {
  if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export async function registerBiometricUnlock(userId, userEmail) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'VaultSnap' },
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
      timeout: 60000,
      attestation: 'none',
    },
  })

  if (!credential) throw new Error('Biometric registration was cancelled')

  await setWebauthnCredentialId(userId, credential.id)
  return credential.id
}

export async function unlockWithBiometric(credentialId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: base64urlToBuffer(credentialId), type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    },
  })

  return Boolean(assertion)
}

function base64urlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
