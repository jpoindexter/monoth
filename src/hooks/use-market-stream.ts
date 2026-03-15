import { useEffect, useRef } from 'react'
import { useMarketStore } from '@/stores/market-store'

interface Tick {
  symbol: string
  price: number
  time: number
  volume: number
}

// Connects to the dev-server SSE stream and patches prices in market-store.
// Silently no-ops in production (Vercel) where the SSE endpoint isn't available.
export function useMarketStream() {
  const applyTick = useMarketStore((s) => s.applyTick)
  const esRef = useRef<EventSource | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function connect() {
      // Only attempt in dev (port 5173 served by Vite proxying to :3000)
      // or when the stream endpoint exists
      const es = new EventSource('/api/stream/quotes')
      esRef.current = es

      es.addEventListener('tick', (e: MessageEvent) => {
        try {
          const tick = JSON.parse(e.data) as Tick
          applyTick(tick.symbol, tick.price)
        } catch {}
      })

      es.onerror = () => {
        es.close()
        esRef.current = null
        // Retry in 10s — avoids hammering if endpoint unavailable (production)
        if (reconnectRef.current) clearTimeout(reconnectRef.current)
        reconnectRef.current = setTimeout(connect, 10_000)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [applyTick])
}
