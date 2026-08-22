import { supabase } from './supabaseClient'

export const FREE_TIER_PHOTO_LIMIT = 25

export async function getSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export function isSubscriptionActive(subscription) {
  return subscription?.status === 'active' || subscription?.status === 'trialing'
}

export async function createCheckoutSession(plan) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Not signed in')

  const response = await fetch('/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ plan }),
  })

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}))
    throw new Error(error || 'Failed to start checkout')
  }

  const { url } = await response.json()
  return url
}

export async function createPortalSession() {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Not signed in')

  const response = await fetch('/.netlify/functions/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}))
    throw new Error(error || 'Failed to open billing portal')
  }

  const { url } = await response.json()
  return url
}
