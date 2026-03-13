import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface ToastItem {
  id: number
  message: string
}

let toastId = 0

export function useToast() {
  return useCallback((message: string) => {
    window.dispatchEvent(new CustomEvent('monoth:toast', { detail: message }))
  }, [])
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    function onToast(e: Event) {
      const message = (e as CustomEvent).detail as string
      const id = ++toastId
      setToasts((prev) => [...prev.slice(-2), { id, message }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    }
    window.addEventListener('monoth:toast', onToast)
    return () => window.removeEventListener('monoth:toast', onToast)
  }, [])

  return (
    <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-1">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-foreground text-background px-3 py-1.5 rounded-sm text-[10px] font-medium shadow-lg"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
