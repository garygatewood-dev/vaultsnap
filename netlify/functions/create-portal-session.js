import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://myvaultsnap.com'

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
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Identity is derived from the verified token, never from client input.
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) }
  }
  const user = userData.user

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subError) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to look up subscription' }) }
  }
  if (!subscription?.stripe_customer_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No Stripe customer on file' }) }
  }

  try {
    const stripe = new Stripe(stripeSecretKey)

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      // Points at /vault directly, not / — see create-checkout.js for why.
      return_url: `${SITE_URL}/vault`,
    })

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) }
  } catch (err) {
    console.error('Stripe portal session error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
