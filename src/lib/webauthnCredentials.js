import { supabase } from './supabaseClient'

export async function listWebauthnCredentialIds(userId) {
  const { data, error } = await supabase
    .from('webauthn_credentials')
    .select('credential_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((row) => row.credential_id)
}

export async function addWebauthnCredential(userId, credentialId, deviceLabel = null) {
  const { error } = await supabase
    .from('webauthn_credentials')
    .insert({ user_id: userId, credential_id: credentialId, device_label: deviceLabel })
  if (error) throw error
}
