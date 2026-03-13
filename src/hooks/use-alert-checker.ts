import { useEffect } from 'react'
import { useMarketStore } from '@/stores/market-store'
import { useAlertStore } from '@/stores/alert-store'

export function useAlertChecker() {
  const alerts = useAlertStore((s) => s.alerts)
  const markTriggered = useAlertStore((s) => s.markTriggered)

  useEffect(() => {
    async function check() {
      const { indices, crypto } = useMarketStore.getState()
      const untriggered = alerts.filter((a) => !a.triggered)
      if (!untriggered.length) return

      // Build price map from known store data
      const priceMap: Record<string, number> = {}
      for (const i of indices) priceMap[i.symbol] = i.price
      for (const c of crypto) priceMap[c.symbol] = c.price

      // Find symbols not in store that need a fresh quote
      const missing = [...new Set(untriggered.map((a) => a.symbol).filter((s) => priceMap[s] == null))]
      if (missing.length > 0) {
        try {
          const res = await fetch(`/api/market/quote?symbols=${missing.join(',')}`)
          if (res.ok) {
            const quotes = await res.json() as { symbol: string; price: number }[]
            for (const q of quotes) priceMap[q.symbol] = q.price
          }
        } catch {
          // best-effort — skip if offline
        }
      }

      for (const alert of untriggered) {
        const price = priceMap[alert.symbol] ?? null
        if (price === null) continue

        const hit =
          (alert.direction === 'above' && price >= alert.targetPrice) ||
          (alert.direction === 'below' && price <= alert.targetPrice)

        if (!hit) continue

        markTriggered(alert.id)

        const msg = `${alert.symbol} ${alert.direction === 'above' ? '▲' : '▼'} $${alert.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} — now $${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        window.dispatchEvent(new CustomEvent('monoth:toast', { detail: msg }))

        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') new Notification('Monoth Price Alert', { body: msg })
        })
      }
    }

    const id = setInterval(check, 15_000)
    return () => clearInterval(id)
  }, [alerts, markTriggered])
}
