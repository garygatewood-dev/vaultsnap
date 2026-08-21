import { supabase } from './supabaseClient'

const BUCKET = 'vault-photos'
const SIGNED_URL_TTL_SECONDS = 60

export async function requestUploadUrls(originalExtension) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Not signed in')

  const response = await fetch('/.netlify/functions/generate-upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ originalExtension }),
  })

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}))
    throw new Error(error || 'Failed to get upload URL')
  }

  return response.json()
}

export async function uploadToSignedUrl(path, token, file) {
  const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(path, token, file)
  if (error) throw error
}

export async function getSignedViewUrl(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error) throw error
  return data.signedUrl
}

export async function removeFiles(paths) {
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) throw error
}
