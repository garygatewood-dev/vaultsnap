import { supabase } from './supabaseClient'

export async function enhancePhoto(photoId) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Not signed in')

  const response = await fetch('/.netlify/functions/enhance-photo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ photoId }),
  })

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}))
    if (error === 'PREMIUM_REQUIRED') throw new Error('Premium required to enhance photos.')
    if (error === 'MONTHLY_ENHANCEMENT_CAP_REACHED') {
      throw new Error("You've used all 100 enhancements for this month — resets on the 1st.")
    }
    throw new Error(error || 'Failed to enhance photo')
  }

  const data = await response.json()
  return data.enhancedStoragePath
}
