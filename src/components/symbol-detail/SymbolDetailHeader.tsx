import { fmt } from '@/lib/panel-utils'
import { X, TrendingUp, TrendingDown, Star, ExternalLink } from 'lucide-react'

interface Props {
  ticker: string
  name: string
  price: number | null
  changePercent: number | null
  isPos: boolean
  watchlisted: boolean
  onToggleWatchlist: () => void
  onClose: () => void
}

export function SymbolDetailHeader({
  ticker, name, price, changePercent, isPos, watchlisted, onToggleWatchlist, onClose,
}: Props) {
  return (
    <div className={`px-5 pt-5 pb-4 border-b border-border/20 ${isPos ? 'bg-emerald-950/10' : 'bg-red-950/10'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[2px] text-muted-foreground mb-0.5">{ticker}</div>
          <div className="text-base font-semibold text-foreground leading-tight">{name}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleWatchlist}
            title={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`p-1.5 rounded transition-colors ${watchlisted ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Star className="w-3.5 h-3.5" fill={watchlisted ? 'currentColor' : 'none'} />
          </button>
          <a
            href={`https://finance.yahoo.com/quote/${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Yahoo Finance"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 -mr-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {price !== null ? (
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold tabular-nums tracking-tight">
            ${fmt(price)}
          </span>
          {changePercent !== null && (
            <div className={`flex items-center gap-1 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span className="text-sm font-semibold tabular-nums">
                {isPos ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-10 w-32 bg-muted/20 rounded animate-pulse" />
      )}
    </div>
  )
}
