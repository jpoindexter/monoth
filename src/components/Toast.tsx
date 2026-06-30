import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface ToastItem {
  id: number
  message: string
  alert?: boolean
}

let toastId = 0

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [flashing, setFlashing] = useState(false)

  useEffect(() => {
    function onToast(e: Event) {
      const message = (e as CustomEvent).detail as string
      const id = ++toastId
      setToasts((prev) => [...prev.slice(-2), { id, message }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
    }
    function onPriceAlert(e: Event) {
      const message = (e as CustomEvent).detail as string
      const id = ++toastId
      setToasts((prev) => [...prev.slice(-2), { id, message, alert: true }])
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
      setFlashing(true)
      setTimeout(() => setFlashing(false), 1500)
    }
    window.addEventListener('monoth:toast', onToast)
    window.addEventListener('monoth:price-alert', onPriceAlert)
    return () => {
      window.removeEventListener('monoth:toast', onToast)
      window.removeEventListener('monoth:price-alert', onPriceAlert)
    }
  }, [])

  return (
    <>
      <AnimatePresence>
        {flashing && (
          <motion.div
            key="alert-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 pointer-events-none border-2 border-red-500"
            style={{ boxShadow: 'inset 0 0 60px rgba(239,68,68,0.25)' }}
          />
        )}
      </AnimatePresence>
      <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-1">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={t.alert
                ? 'bg-red-500 text-white px-3 py-1.5 rounded-sm text-[10px] font-bold shadow-lg shadow-red-500/30'
                : 'bg-foreground text-background px-3 py-1.5 rounded-sm text-[10px] font-medium shadow-lg'
              }
            >
              {t.alert && <span className="mr-1">⚡</span>}{t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
