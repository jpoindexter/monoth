import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSpanStore } from '@/stores/span-store'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const getSpan = useSpanStore((s) => s.getSpan)
  const setSpan = useSpanStore((s) => s.setSpan)
  const span = getSpan(panelId)
  const spanLabel = `${span.col}×${span.row}`

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close()
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellKeyDown = (e: React.KeyboardEvent, col: number, row: number) => {
    let nc = col, nr = row
    if (e.key === 'ArrowRight') { e.preventDefault(); nc = Math.min(3, col + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); nc = Math.max(1, col - 1) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); nr = Math.min(3, row + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nr = Math.max(1, row - 1) }
    else return
    containerRef.current?.querySelector<HTMLElement>(`[data-cell="${nc}-${nr}"]`)?.focus()
  }

  const hoverLabel = hover ? `${hover.col}×${hover.row}` : spanLabel

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Resize panel, current size ${spanLabel}`}
        className="px-1 py-0.5 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors text-[9px] font-medium tabular-nums"
      >
        {spanLabel}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Choose panel size"
          className="absolute top-full right-0 mt-1 z-50 bg-zinc-900 dark:bg-zinc-800 border border-border/40 rounded-md shadow-lg p-2 flex flex-col items-center gap-1"
        >
          <div
            role="grid"
            aria-label="Panel size grid"
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: 'repeat(3, 12px)' }}
            onMouseLeave={() => setHover(null)}
          >
            {[1, 2, 3].map((row) => (
              <div key={row} role="row" style={{ display: 'contents' }}>
                {[1, 2, 3].map((col) => {
                  const lit = hover ? col <= hover.col && row <= hover.row : col <= span.col && row <= span.row
                  return (
                    <div key={`${col}-${row}`} role="gridcell">
                      <button
                        data-cell={`${col}-${row}`}
                        aria-label={`${col}×${row}`}
                        aria-pressed={col === span.col && row === span.row}
                        className={`w-3 h-3 rounded-[2px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60 ${lit ? 'bg-foreground/50' : 'bg-border/30'}`}
                        onMouseEnter={() => setHover({ col, row })}
                        onFocus={() => setHover({ col, row })}
                        onBlur={() => setHover(null)}
                        onClick={() => { setSpan(panelId, col, row); close(); setHover(null) }}
                        onKeyDown={(e) => handleCellKeyDown(e, col, row)}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground tabular-nums" aria-live="polite">{hoverLabel}</span>
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
  noScroll?: boolean
  headerActions?: React.ReactNode
}

function useDataAge(loading: boolean | undefined): string {
  const [refreshedAt, setRefreshedAt] = useState<number | null>(null)
  const [age, setAge] = useState('')
  const prevLoading = useRef(loading)

  useEffect(() => {
    if (prevLoading.current === true && loading === false) {
      setRefreshedAt(Date.now())
    }
    prevLoading.current = loading
  }, [loading])

  useEffect(() => {
    if (refreshedAt == null) return
    function update() {
      if (refreshedAt == null) return
      const s = Math.floor((Date.now() - refreshedAt) / 1000)
      if (s < 60) setAge(`${s}s`)
      else if (s < 3600) setAge(`${Math.floor(s / 60)}m`)
      else setAge(`${Math.floor(s / 3600)}h`)
    }
    update()
    const id = setInterval(update, 15_000)
    return () => clearInterval(id)
  }, [refreshedAt])

  return age
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function PanelWrapper({ title, panelId, children, loading, error, onRetry, noScroll, headerActions }: PanelWrapperProps) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const contextPanelId = usePanelId()
  const effectivePanelId = panelId ?? contextPanelId
  const age = useDataAge(loading)

  const panelRef = useRef<HTMLDivElement>(null)
  const expandBtnRef = useRef<HTMLButtonElement>(null)

  // Focus trap + Escape when expanded
  useEffect(() => {
    if (!expanded) return
    const panel = panelRef.current
    if (!panel) return

    const getFocusable = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setExpanded(false); return }
      if (e.key !== 'Tab') return
      const els = getFocusable()
      if (els.length === 0) return
      const first = els[0], last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKeyDown)
    getFocusable()[0]?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      expandBtnRef.current?.focus()
    }
  }, [expanded])

  return (
    <>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: expanded ? 1 : hovered ? 1 : 0.72 }}
        whileHover={expanded ? undefined : { scale: 1.003 }}
        transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { duration: 0.3, ease: 'easeOut' } }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded ? 'true' : undefined}
        aria-label={expanded ? title : undefined}
        tabIndex={expanded ? -1 : undefined}
        className={`flex flex-col bg-white dark:bg-bg-surface rounded-sm border overflow-hidden transition-colors duration-150 ${
          expanded
            ? 'fixed inset-2 z-50 border-border/60'
            : hovered
            ? 'h-full border-border/70 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
            : 'h-full border-border/30'
        }`}
      >
        <div className={`px-2 py-1 shrink-0 border-b flex items-center transition-colors duration-150 ${hovered ? 'border-border/40 bg-black/[0.04] dark:bg-white/[0.05]' : 'border-border/20 bg-black/[0.02] dark:bg-white/[0.02]'}`}>
          <h3 className={`text-[10px] font-semibold uppercase tracking-[1px] flex-1 transition-colors duration-150 ${hovered ? 'text-foreground/80' : 'text-muted-foreground'}`}>{title}</h3>
          {headerActions && <div className="flex items-center gap-1 mr-1">{headerActions}</div>}
          {age && !loading && !error && (
            <span className="text-[9px] tabular-nums text-muted-foreground/40 mr-1" title="Last updated">{age}</span>
          )}
          <div className="flex items-center gap-0.5">
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
                aria-label="Refresh panel"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            )}
            {effectivePanelId && <SpanPicker panelId={effectivePanelId} />}
            <button
              ref={expandBtnRef}
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              aria-label={expanded ? 'Minimize panel' : 'Expand panel'}
              aria-expanded={expanded}
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
                <button onClick={onRetry} className="text-[10px] text-muted-foreground hover:text-foreground underline">
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
                className={`h-full p-2 ${noScroll ? 'overflow-hidden flex flex-col' : 'overflow-auto'}`}
              >
                {children}
              </motion.div>
            </ExpandedContext.Provider>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setExpanded(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  )
}
