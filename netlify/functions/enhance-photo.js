import { createClient } from '@supabase/supabase-js'
import Replicate from 'replicate'

const BUCKET = 'vault-photos'
// Kept in sync with the enforce_enhancement_cap trigger in supabase/phase6.sql,
// which is the actual authority — this check here only saves a wasted Replicate
// call (real money) before that trigger would reject the log-insert anyway.
const MONTHLY_ENHANCEMENT_CAP = 100

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
  const replicateToken = process.env.REPLICATE_API_TOKEN

  if (!supabaseUrl || !serviceRoleKey || !replicateToken) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Identity is derived from the verified token, never from client input.
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

  const photoId = body.photoId
  if (!photoId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing photoId' }) }
  }

  const [{ data: subscription }, { count: monthlyCount }, { data: photo, error: photoError }] = await Promise.all([
    supabase.from('subscriptions').select('status').eq('user_id', userId).maybeSingle(),
    supabase
      .from('photo_enhancements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonthISO()),
    supabase.from('photos').select('id, user_id, storage_path').eq('id', photoId).maybeSingle(),
  ])

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing'
  if (!hasActiveSubscription) {
    return { statusCode: 402, body: JSON.stringify({ error: 'PREMIUM_REQUIRED' }) }
  }
  if ((monthlyCount ?? 0) >= MONTHLY_ENHANCEMENT_CAP) {
    return { statusCode: 402, body: JSON.stringify({ error: 'MONTHLY_ENHANCEMENT_CAP_REACHED' }) }
  }
  if (photoError || !photo || photo.user_id !== userId) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Photo not found' }) }
  }

  try {
    const { data: signedOriginal, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(photo.storage_path, 300)
    if (signError) throw signError

    // nightmareai/real-esrgan does upscaling AND face restoration (GFPGAN,
    // via face_enhance) in a single call — one model, one round trip, which
    // is what backs the single "Enhance" button rather than us chaining two
    // separate models together ourselves.
    const replicate = new Replicate({ auth: replicateToken })
    const output = await replicate.run('nightmareai/real-esrgan', {
      input: {
        image: signedOriginal.signedUrl,
        scale: 2,
        face_enhance: true,
      },
    })

    const enhancedResponse = await fetch(output.url())
    if (!enhancedResponse.ok) throw new Error('Failed to download enhanced image from Replicate')
    const enhancedBuffer = Buffer.from(await enhancedResponse.arrayBuffer())

    const enhancedPath = photo.storage_path.replace(/\.[^.]+$/, '-enhanced.png')
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(enhancedPath, enhancedBuffer, { contentType: 'image/png', upsert: true })
    if (uploadError) throw uploadError

    const { error: updateError } = await supabase
      .from('photos')
      .update({ enhanced_storage_path: enhancedPath })
      .eq('id', photoId)
    if (updateError) throw updateError

    // This insert is what the monthly-cap trigger actually counts against —
    // logged last, only once the enhancement genuinely succeeded end to end.
    const { error: logError } = await supabase
      .from('photo_enhancements')
      .insert({ user_id: userId, photo_id: photoId })
    if (logError) throw logError

    return { statusCode: 200, body: JSON.stringify({ enhancedStoragePath: enhancedPath }) }
  } catch (err) {
    console.error('Enhance error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

function startOfMonthISO() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}
