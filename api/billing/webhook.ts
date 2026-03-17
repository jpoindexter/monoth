import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { buffer } from 'micro'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature' })

  let event: Stripe.Event
  try {
    const raw = await buffer(req)
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    return res.status(400).json({ error: msg })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      if (userId) {
        await supabaseAdmin
          .from('users')
          .update({ tier: 'pro', stripe_customer_id: session.customer })
          .eq('id', userId)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await supabaseAdmin
        .from('users')
        .update({ tier: 'free' })
        .eq('stripe_customer_id', sub.customer)
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      const active = sub.status === 'active' || sub.status === 'trialing'
      await supabaseAdmin
        .from('users')
        .update({ tier: active ? 'pro' : 'free' })
        .eq('stripe_customer_id', sub.customer)
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
