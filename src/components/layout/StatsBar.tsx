import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useMarketData } from '@/hooks/use-market-data'
import { useCryptoData } from '@/hooks/use-crypto-data'
import { useSectorData } from '@/hooks/use-sector-data'
import { useMarketStore } from '@/stores'
import { fmt } from '@/lib/panel-utils'

interface StatItem {
  label: string
  value: string
  change?: number
}

export function StatsBar() {
  const navigate = useNavigate()
  useMarketData()
  useCryptoData()
  useSectorData()

  const indices = useMarketStore((s) => s.indices)
  const crypto = useMarketStore((s) => s.crypto)
  const commodities = useMarketStore((s) => s.commodities)

  const sp500 = indices.find((i) => i.symbol === 'SPY')
  const nasdaq = indices.find((i) => i.symbol === 'QQQ')
  const dow = indices.find((i) => i.symbol === 'DIA')
  const russell = indices.find((i) => i.symbol === 'IWM')
  const vti = indices.find((i) => i.symbol === 'VTI')
  const bitcoin = crypto.find((c) => c.id === 'bitcoin')
  const ethereum = crypto.find((c) => c.id === 'ethereum')
  const gold = commodities.find((c) => c.symbol === 'GLD')
  const oil = commodities.find((c) => c.symbol === 'USO')

  const stats = [
    sp500 && sp500.price != null && { label: 'SPY', value: fmt(sp500.price), change: sp500.changePercent },
    dow && dow.price != null && { label: 'DIA', value: fmt(dow.price), change: dow.changePercent },
    nasdaq && nasdaq.price != null && { label: 'QQQ', value: fmt(nasdaq.price), change: nasdaq.changePercent },
    russell && russell.price != null && { label: 'IWM', value: fmt(russell.price), change: russell.changePercent },
    vti && vti.price != null && { label: 'VTI', value: fmt(vti.price), change: vti.changePercent },
    gold && gold.price != null && { label: 'GLD', value: fmt(gold.price), change: gold.changePercent },
    oil && oil.price != null && { label: 'USO', value: fmt(oil.price), change: oil.changePercent },
    bitcoin && bitcoin.price != null && { label: 'BTC', value: `$${bitcoin.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, change: bitcoin.changePercent24h },
    ethereum && ethereum.price != null && { label: 'ETH', value: `$${fmt(ethereum.price)}`, change: ethereum.changePercent24h },
  ].filter(Boolean) as StatItem[]

  if (stats.length === 0) return null

  const renderItem = (s: StatItem, key: string) => {
    const isPositive = (s.change ?? 0) >= 0
    return (
      <button
        key={key}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 whitespace-nowrap hover:opacity-80 focus-visible:outline-none focus-visible:opacity-80"
        onClick={() => navigate(`/symbol/${s.label}`)}
        aria-label={`${s.label} ${s.value}${s.change != null ? ` ${isPositive ? '+' : ''}${s.change.toFixed(2)}%` : ''}`}
      >
        <span className="text-muted-foreground font-medium">{s.label}</span>
        <span className="tabular-nums font-medium text-foreground">{s.value}</span>
        {s.change != null && (
          <span className={`tabular-nums font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{s.change.toFixed(2)}%
          </span>
        )}
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="border-b border-border/40 bg-white dark:bg-bg-chrome h-6 flex items-center shrink-0 overflow-hidden relative"
      aria-label="Market summary"
      role="region"
    >
      <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white dark:from-bg-chrome to-transparent z-10 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white dark:from-bg-chrome to-transparent z-10 pointer-events-none" aria-hidden="true" />
      <div className="flex items-center h-full animate-marquee whitespace-nowrap text-[10px]" aria-hidden="true">
        {stats.map((s) => renderItem(s, s.label))}
        {stats.map((s) => renderItem(s, `${s.label}-2`))}
      </div>
    </motion.div>
  )
}
