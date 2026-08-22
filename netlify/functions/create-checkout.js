import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://garyvaultsnap.netlify.app'

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

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const PRICE_MAP = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    annual: process.env.STRIPE_PRICE_ANNUAL,
  }

  const priceId = PRICE_MAP[body.plan]
  if (!priceId) {
    return { statusCode: 400, body: JSON.stringify({ error: `Unknown plan: ${body.plan}` }) }
  }

  try {
    const stripe = new Stripe(stripeSecretKey)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: { user_id: user.id },
      subscription_data: {
        trial_period_days: 2,
        metadata: { user_id: user.id },
      },
      success_url: `${SITE_URL}/?checkout=success`,
      cancel_url: `${SITE_URL}/?checkout=cancelled`,
    })

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) }
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
