import express from 'express'
import { readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { readFileSync } from 'fs'
import { WebSocket } from 'ws'
import type { Response } from 'express'

// Load .env manually (no dotenv dependency)
try {
  const envFile = readFileSync(join(import.meta.dirname, '.env'), 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const val = trimmed.slice(eq + 1)
    if (!process.env[key]) process.env[key] = val
  }
} catch {}

const app = express()
app.use(express.json())

const apiDir = join(import.meta.dirname, 'api')

function findRoutes(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...findRoutes(full))
    } else if (entry.endsWith('.ts') && !entry.startsWith('_')) {
      files.push(full)
    }
  }
  return files
}

async function loadRoutes() {
  const files = findRoutes(apiDir)

  for (const file of files) {
    const rel = relative(apiDir, file).replace(/\.ts$/, '')
    const route = `/api/${rel}`
    let mod
    try {
      mod = await import(file)
    } catch (e) {
      console.log(`  ${route} (SKIPPED: ${e instanceof Error ? e.message.split('\n')[0] : 'import error'})`)
      continue
    }
    const handler = mod.default

    if (typeof handler === 'function') {
      app.all(route, (req, res) => {
        handler(req, res)
      })
      console.log(`  ${route}`)
    }
  }
}

// --- Finnhub WebSocket → SSE stream ---
const STREAM_SYMBOLS = [
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'TSLA',
  'BTC-USD', 'ETH-USD', 'GLD', 'SLV', 'CL1!', 'DXY',
]

const sseClients = new Set<Response>()
let finnhubWs: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
let wsOpenedAt = 0
let finnhubGaveUp = false      // set permanently on 429 — no more reconnects ever
const MAX_RECONNECT_ATTEMPTS = 8
const STABLE_THRESHOLD = 30_000

function broadcastSSE(event: string, data: unknown) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of sseClients) {
    try { res.write(msg) } catch { sseClients.delete(res) }
  }
}

function connectFinnhub() {
  const key = process.env.FINNHUB_API_KEY
  if (!key || finnhubGaveUp) return
  if (finnhubWs) { try { finnhubWs.terminate() } catch {} }

  finnhubWs = new WebSocket(`wss://ws.finnhub.io?token=${key}`)

  finnhubWs.on('open', () => {
    console.log('[stream] Finnhub WS connected')
    wsOpenedAt = Date.now()
    for (const sym of STREAM_SYMBOLS) {
      finnhubWs!.send(JSON.stringify({ type: 'subscribe', symbol: sym }))
    }
  })

  finnhubWs.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as { type: string; data?: { s: string; p: number; t: number; v: number }[] }
      if (msg.type === 'trade' && msg.data?.length) {
        // Deduplicate: last price per symbol
        const latest: Record<string, { symbol: string; price: number; time: number; volume: number }> = {}
        for (const t of msg.data) {
          latest[t.s] = { symbol: t.s, price: t.p, time: t.t, volume: t.v }
        }
        for (const tick of Object.values(latest)) {
          broadcastSSE('tick', tick)
        }
      }
    } catch {}
  })

  finnhubWs.on('error', (e) => {
    if (e.message.includes('429')) {
      finnhubGaveUp = true
      console.warn('[stream] Finnhub WS 429 — free tier does not support WS. Streaming disabled.')
    } else {
      console.error('[stream] Finnhub WS error:', e.message)
    }
  })

  finnhubWs.on('close', () => {
    if (finnhubGaveUp) return

    const heldFor = wsOpenedAt ? Date.now() - wsOpenedAt : 0
    if (heldFor >= STABLE_THRESHOLD) {
      reconnectAttempts = 0
    } else {
      reconnectAttempts++
    }
    wsOpenedAt = 0

    if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      console.warn('[stream] Finnhub WS gave up after too many failures. Streaming disabled.')
      return
    }
    const delay = Math.min(5_000 * Math.pow(2, reconnectAttempts - 1), 120_000)
    console.log(`[stream] Finnhub WS closed — reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connectFinnhub, delay)
  })
}

async function start() {
  console.log('Loading API routes...')
  await loadRoutes()

  // SSE endpoint — streams Finnhub trades to frontend
  app.get('/api/stream/quotes', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.flushHeaders()

    sseClients.add(res)
    console.log(`[stream] SSE client connected (${sseClients.size} total)`)

    // Send a ping every 20s to keep connection alive
    const ping = setInterval(() => {
      try { res.write(': ping\n\n') } catch { clearInterval(ping) }
    }, 20_000)

    req.on('close', () => {
      clearInterval(ping)
      sseClients.delete(res)
      console.log(`[stream] SSE client disconnected (${sseClients.size} remaining)`)
    })
  })

  console.log('')
  app.listen(3000, () => {
    console.log('API server running at http://localhost:3000')
    console.log('Run "npm run dev" in another terminal for the frontend')
    connectFinnhub()
  })
}

start()
