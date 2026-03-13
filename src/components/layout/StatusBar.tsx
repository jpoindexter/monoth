import { useState, useEffect } from 'react'
import { useLayoutStore } from '@/stores'

export function StatusBar() {
  const locked = useLayoutStore((s) => s.locked)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 10_000)
    return () => clearInterval(timer)
  }, [])

  const etTime = time.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <div className="h-5 border-t border-border/40 bg-white dark:bg-[#0a0a0a] px-3 flex items-center justify-between text-[8px] text-muted-foreground/60 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span className="uppercase tracking-wider font-medium">Monoth v0.7</span>
        <span className="hidden sm:inline">ET {etTime}</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="bg-muted/50 px-1 py-px rounded font-mono">/</kbd>
        <span>search</span>
        <kbd className="bg-muted/50 px-1 py-px rounded font-mono">D</kbd>
        <span>theme</span>
        <kbd className="bg-muted/50 px-1 py-px rounded font-mono">L</kbd>
        <span>{locked ? 'unlock' : 'lock'}</span>
        <kbd className="bg-muted/50 px-1 py-px rounded font-mono">R</kbd>
        <span>refresh</span>
      </div>
    </div>
  )
}
