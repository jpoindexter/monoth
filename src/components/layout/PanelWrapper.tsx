import { useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const ExpandedContext = createContext(false)
export const useIsExpanded = () => useContext(ExpandedContext)

interface PanelWrapperProps {
  title: string
  children?: React.ReactNode
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function PanelWrapper({ title, children, loading, error, onRetry }: PanelWrapperProps) {
  const [expanded, setExpanded] = useState(false)

  const panel = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col bg-white dark:bg-[#141414] rounded-sm border border-border/40 overflow-hidden ${
        expanded
          ? 'fixed inset-2 z-50'
          : 'h-full'
      }`}
    >
      <div className="px-2 py-1 shrink-0 border-b border-border/30 bg-black/[0.02] dark:bg-white/[0.03] flex items-center">
        <h3 className="text-[10px] font-semibold uppercase tracking-[1px] text-muted-foreground flex-1">{title}</h3>
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
