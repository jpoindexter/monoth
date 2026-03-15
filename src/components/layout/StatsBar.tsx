import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useMarketData } from '@/hooks/use-market-data'
import { useCryptoData } from '@/hooks/use-crypto-data'
import { useSectorData } from '@/hooks/use-sector-data'
import { useMarketStore } from '@/stores'
import { useMarketStream } from '@/hooks/use-market-stream'

interface StatItem {
  label: string
  value: string
  change?: number
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function MiniSparkline({ changePercent }: { changePercent: number }) {
  const trend = changePercent / 100
  const points = [0, 1, 2, 3, 4].map((i) => {
    const base = 5
    const noise = Math.sin(i * 1.5) * 1.5
    const direction = (i / 4) * trend * 8
    return base - direction - noise
  })
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const normalized = points.map((p) => ((p - min) / range) * 8 + 1)
  const pathPoints = normalized.map((y, i) => `${i * 5},${y}`).join(' ')
  const color = changePercent >= 0 ? '#059669' : '#ef4444'

  return (
    <svg width="20" height="10" className="inline-block ml-0.5" viewBox="0 0 20 10">
      <polyline points={pathPoints} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatsBar() {
  const navigate = useNavigate()
  useMarketData()
  useCryptoData()
  useSectorData()
  useMarketStream()

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="border-b border-border/40 bg-white dark:bg-[#0a0a0a] px-3 h-6 flex items-center shrink-0"
    >
      <div className="flex items-center gap-4 overflow-x-auto text-[10px] no-scrollbar">
        <AnimatePresence mode="popLayout">
          {stats.map((s, i) => {
            const isPositive = (s.change ?? 0) >= 0
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:opacity-80"
                onClick={() => navigate(`/symbol/${s.label}`)}
              >
                <span className="text-muted-foreground font-medium">{s.label}</span>
                <span className="tabular-nums font-medium text-foreground">{s.value}</span>
                {s.change != null && (
                  <>
                    <motion.span
                      key={`${s.label}-${s.change.toFixed(2)}`}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className={`tabular-nums font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {isPositive ? '+' : ''}{s.change.toFixed(2)}%
                    </motion.span>
                    {!isNaN(s.change) && <MiniSparkline changePercent={s.change} />}
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
