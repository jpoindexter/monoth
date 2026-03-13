import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const SHORTCUTS = [
  { key: '/', description: 'Open command palette' },
  { key: 'D', description: 'Toggle dark/light theme' },
  { key: 'L', description: 'Lock/unlock layout' },
  { key: 'R', description: 'Refresh all panels' },
  { key: '?', description: 'Show this help' },
]

export function KeyboardHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === '?') {
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-sm shadow-xl p-5 min-w-[220px]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Keyboard Shortcuts
            </p>
            <div className="flex flex-col gap-2">
              {SHORTCUTS.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between gap-6">
                  <span className="text-[11px] text-muted-foreground">{description}</span>
                  <kbd className="text-[10px] font-mono bg-muted text-foreground px-1.5 py-0.5 rounded-sm border border-border">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
