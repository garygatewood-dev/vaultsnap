import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return { statusCode: 500, body: 'Server not configured' }
  }

  const stripe = new Stripe(stripeSecretKey)
  const signature = event.headers['stripe-signature']

  // The signature is computed over the exact raw bytes Stripe sent — Netlify may
  // hand the body back base64-encoded, so decode before verifying, never JSON.parse first.
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Idempotency: record this event id; if it's already been seen (a Stripe retry
  // of the same delivery), skip reprocessing entirely.
  const { data: inserted, error: ledgerError } = await supabase
    .from('stripe_webhook_events')
    .upsert({ stripe_event_id: stripeEvent.id }, { onConflict: 'stripe_event_id', ignoreDuplicates: true })
    .select()

  if (ledgerError) {
    console.error('Failed to record webhook event:', ledgerError)
    return { statusCode: 500, body: JSON.stringify({ error: 'Ledger write failed' }) }
  }

  if (!inserted || inserted.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ received: true, duplicate: true }) }
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object
        const userId = session.metadata?.user_id
        if (userId) {
          const { error } = await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              status: 'trialing',
            },
            { onConflict: 'user_id' },
          )
          if (error) console.error('Failed to upsert subscription on checkout completion:', error)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = stripeEvent.data.object
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        if (error) console.error('Failed to update subscription:', error)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = stripeEvent.data.object
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id)
        if (error) console.error('Failed to mark subscription cancelled:', error)
        break
      }

      // customer.subscription.trial_will_end (trial-ending reminder email) is Phase 6.

      default:
        break
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
