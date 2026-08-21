import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const BUCKET = 'vault-photos'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const authHeader = event.headers.authorization || event.headers.Authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing bearer token' }) }
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Identity is derived from the verified token, never from client input —
  // this is what stops a client from requesting an upload URL under another user's folder.
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) }
  }
  const userId = userData.user.id

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const extension = sanitizeExtension(body.originalExtension)
  if (!extension) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid originalExtension' }) }
  }

  const photoId = randomUUID()
  const originalPath = `${userId}/${photoId}-original.${extension}`
  const thumbnailPath = `${userId}/${photoId}-thumb.jpg`

  const [originalSigned, thumbnailSigned] = await Promise.all([
    supabase.storage.from(BUCKET).createSignedUploadUrl(originalPath),
    supabase.storage.from(BUCKET).createSignedUploadUrl(thumbnailPath),
  ])

  if (originalSigned.error || thumbnailSigned.error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create signed upload URL' }) }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      photoId,
      original: { path: originalSigned.data.path, token: originalSigned.data.token },
      thumbnail: { path: thumbnailSigned.data.path, token: thumbnailSigned.data.token },
    }),
  }
}

function sanitizeExtension(ext) {
  if (typeof ext !== 'string') return null
  const cleaned = ext.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!cleaned || cleaned.length > 10) return null
  return cleaned
}
