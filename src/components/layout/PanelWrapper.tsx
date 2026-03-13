import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSpanStore } from '@/stores/span-store'

// FlashValue: wraps a number cell and pulses green/red when value changes
export function FlashValue({ value, className = '' }: { value: number | string | null | undefined; className?: string }) {
  const prev = useRef(value)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (prev.current === value || value == null || prev.current == null) {
      prev.current = value
      return
    }
    const dir = Number(value) > Number(prev.current) ? 'flash-up' : 'flash-down'
    prev.current = value
    const el = ref.current
    if (!el) return
    el.classList.remove('flash-up', 'flash-down')
    void el.offsetWidth
    el.classList.add(dir)
  }, [value])

  return <span ref={ref} className={`rounded-[2px] px-0.5 -mx-0.5 ${className}`}>{value}</span>
}

const ExpandedContext = createContext(false)
export const useIsExpanded = () => useContext(ExpandedContext)

const PanelIdContext = createContext<string | undefined>(undefined)
export const usePanelId = () => useContext(PanelIdContext)
export function PanelIdProvider({ id, children }: { id: string; children: React.ReactNode }) {
  return <PanelIdContext.Provider value={id}>{children}</PanelIdContext.Provider>
}

function SpanPicker({ panelId }: { panelId: string }) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<{ col: number; row: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const getSpan = useSpanStore((s) => s.getSpan)
  const setSpan = useSpanStore((s) => s.setSpan)
  const span = getSpan(panelId)
  const spanLabel = `${span.col}×${span.row}`

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const hoverLabel = hover ? `${hover.col}×${hover.row}` : spanLabel

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-1 py-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors text-[8px] font-medium tabular-nums"
        title={`Resize (${spanLabel})`}
      >
        {spanLabel}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-zinc-900 dark:bg-zinc-800 border border-border/40 rounded-md shadow-lg p-2 flex flex-col items-center gap-1">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: 'repeat(3, 12px)' }}
            onMouseLeave={() => setHover(null)}
          >
            {[1, 2, 3].map((row) =>
              [1, 2, 3].map((col) => {
                const lit = hover ? col <= hover.col && row <= hover.row : col <= span.col && row <= span.row
                return (
                  <div
                    key={`${col}-${row}`}
                    className={`w-3 h-3 rounded-[2px] cursor-pointer transition-colors ${lit ? 'bg-foreground/50' : 'bg-border/30'}`}
                    onMouseEnter={() => setHover({ col, row })}
                    onClick={() => {
                      setSpan(panelId, col, row)
                      setOpen(false)
                      setHover(null)
                    }}
                  />
                )
              })
            )}
          </div>
          <span className="text-[8px] text-muted-foreground tabular-nums">{hoverLabel}</span>
        </div>
      )}
    </div>
  )
}

interface PanelWrapperProps {
  title: string
  panelId?: string
  children?: React.ReactNode
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function PanelWrapper({ title, panelId, children, loading, error, onRetry }: PanelWrapperProps) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const contextPanelId = usePanelId()
  const effectivePanelId = panelId ?? contextPanelId

  const panel = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: expanded ? 1 : hovered ? 1 : 0.72 }}
      whileHover={expanded ? undefined : { scale: 1.003 }}
      transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { duration: 0.3, ease: 'easeOut' } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`flex flex-col bg-white dark:bg-[#141414] rounded-sm border overflow-hidden transition-colors duration-150 ${
        expanded
          ? 'fixed inset-2 z-50 border-border/60'
          : hovered
          ? 'h-full border-border/70 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
          : 'h-full border-border/30'
      }`}
    >
      <div className={`px-2 py-1 shrink-0 border-b flex items-center transition-colors duration-150 ${hovered ? 'border-border/40 bg-black/[0.04] dark:bg-white/[0.05]' : 'border-border/20 bg-black/[0.02] dark:bg-white/[0.02]'}`}>
        <h3 className={`text-[10px] font-semibold uppercase tracking-[1px] flex-1 transition-colors duration-150 ${hovered ? 'text-foreground/80' : 'text-muted-foreground'}`}>{title}</h3>
        <div className="flex items-center gap-0.5">
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
          )}
          {effectivePanelId && <SpanPicker panelId={effectivePanelId} />}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? 'Minimize' : 'Expand'}
          >
            {expanded ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5" />}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="space-y-1 p-2">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
            <p className="text-[10px] text-destructive">{error}</p>
            {onRetry && (
              <button onClick={onRetry} className="text-[9px] text-muted-foreground hover:text-foreground underline">
                Retry
              </button>
            )}
          </div>
        ) : (
          <ExpandedContext.Provider value={expanded}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="h-full overflow-auto p-2"
            >
              {children}
            </motion.div>
          </ExpandedContext.Provider>
        )}
      </div>
    </motion.div>
  )

  return (
    <>
      {panel}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
