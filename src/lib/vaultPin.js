import { supabase } from './supabaseClient'

const ITERATIONS = 150000
const HASH_ALG = 'SHA-256'
const KEY_LENGTH_BITS = 256
const SALT_LENGTH_BYTES = 16

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function derivePinHash(pin, saltBuffer) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations: ITERATIONS, hash: HASH_ALG },
    keyMaterial,
    KEY_LENGTH_BITS,
  )
  return bufferToBase64(derived)
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function setupVaultPin(userId, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES))
  const hash = await derivePinHash(pin, salt.buffer)
  const encoded = `${bufferToBase64(salt.buffer)}:${hash}`

  const { error } = await supabase
    .from('vault_pins')
    .upsert({ user_id: userId, pin_hash: encoded }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function getVaultPinRecord(userId) {
  const { data, error } = await supabase
    .from('vault_pins')
    .select('pin_hash, webauthn_credential_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function verifyVaultPin(userId, pin) {
  const record = await getVaultPinRecord(userId)
  if (!record?.pin_hash) return false

  const [saltB64, expectedHash] = record.pin_hash.split(':')
  if (!saltB64 || !expectedHash) return false

  const candidateHash = await derivePinHash(pin, base64ToBuffer(saltB64))
  return timingSafeEqual(candidateHash, expectedHash)
}

export async function setWebauthnCredentialId(userId, credentialId) {
  const { error } = await supabase
    .from('vault_pins')
    .update({ webauthn_credential_id: credentialId })
    .eq('user_id', userId)
  if (error) throw error
}
