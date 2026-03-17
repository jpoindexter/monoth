import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
}

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function fetchPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {}
  await Promise.allSettled(
    symbols.map(async (sym) => {
      const r = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
        { headers: YF_HEADERS, signal: AbortSignal.timeout(6_000) }
      )
      if (!r.ok) return
      const j = await r.json()
      const price = j.chart?.result?.[0]?.meta?.regularMarketPrice
      if (price != null) prices[sym] = price
    })
  )
  return prices
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return // email silently skipped if no key configured
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'alerts@monoth.app', to, subject, html }),
    signal: AbortSignal.timeout(8_000),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request (Vercel sets Authorization: Bearer <CRON_SECRET>)
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const db = getSupabase()

    // Fetch all untriggered alerts
    const { data: alerts } = await db
      .from('monoth_alerts')
      .select('id, user_id, symbol, target_price, direction')
      .eq('triggered', false)

    if (!alerts || alerts.length === 0) {
      return res.json({ checked: 0, triggered: 0 })
    }

    // Get current prices for all unique symbols
    const symbols = [...new Set(alerts.map((a) => a.symbol as string))]
    const prices = await fetchPrices(symbols)

    // Find triggered alerts
    const triggered = alerts.filter((a) => {
      const price = prices[a.symbol as string]
      if (price == null) return false
      return (a.direction === 'above' && price >= a.target_price) ||
             (a.direction === 'below' && price <= a.target_price)
    })

    if (triggered.length === 0) {
      return res.json({ checked: alerts.length, triggered: 0 })
    }

    // Get emails for affected users
    const userIds = [...new Set(triggered.map((a) => a.user_id as string))]
    const emailMap: Record<string, string> = {}
    for (const uid of userIds) {
      const { data: u } = await db.auth.admin.getUserById(uid)
      if (u.user?.email) emailMap[uid] = u.user.email
    }

    // Send emails and mark triggered
    await Promise.allSettled(
      triggered.map(async (a) => {
        const price = prices[a.symbol as string]!
        const email = emailMap[a.user_id as string]
        const dir = a.direction === 'above' ? '▲ above' : '▼ below'
        const msg = `${a.symbol} hit ${dir} $${(a.target_price as number).toLocaleString('en-US', { minimumFractionDigits: 2 })} — now $${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

        if (email) {
          await sendEmail(
            email,
            `Monoth Alert: ${a.symbol} ${dir} $${a.target_price}`,
            `<p style="font-family:monospace">${msg}</p><p style="font-family:monospace;color:#888">View dashboard: https://monoth.app/dashboard</p>`
          )
        }

        await db.from('monoth_alerts').update({ triggered: true }).eq('id', a.id)
      })
    )

    return res.json({ checked: alerts.length, triggered: triggered.length })
  } catch (e) {
    console.error('Alert check error:', e)
    return res.status(500).json({ error: 'Alert check failed' })
  }
}
