import { useEffect } from 'react'
import { useMarketStore } from '@/stores/market-store'
import { useAlertStore } from '@/stores/alert-store'

export function useAlertChecker() {
  const alerts = useAlertStore((s) => s.alerts)
  const markTriggered = useAlertStore((s) => s.markTriggered)

  useEffect(() => {
    function check() {
      const { indices, crypto } = useMarketStore.getState()
      const untriggered = alerts.filter((a) => !a.triggered)
      if (!untriggered.length) return

      for (const alert of untriggered) {
        const indexMatch = indices.find((i) => i.symbol === alert.symbol)
        const cryptoMatch = crypto.find((c) => c.symbol === alert.symbol)
        const price = indexMatch?.price ?? cryptoMatch?.price ?? null

        if (price === null) continue

        const hit =
          (alert.direction === 'above' && price >= alert.targetPrice) ||
          (alert.direction === 'below' && price <= alert.targetPrice)

        if (!hit) continue

        markTriggered(alert.id)

        const msg = `Alert: ${alert.symbol} ${alert.direction} $${alert.targetPrice}`
        window.dispatchEvent(new CustomEvent('monoth:toast', { detail: msg }))

        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') new Notification('Monoth Alert', { body: msg })
        })
      }
    }

    const id = setInterval(check, 10000)
    return () => clearInterval(id)
  }, [alerts, markTriggered])
}
