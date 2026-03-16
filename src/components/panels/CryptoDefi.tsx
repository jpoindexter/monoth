const CHAIN_COLORS: Record<string, string> = {
  Ethereum: 'bg-blue-500', BSC: 'bg-yellow-500', Arbitrum: 'bg-sky-400',
  Solana: 'bg-purple-500', Polygon: 'bg-violet-500', Avalanche: 'bg-red-500',
  Optimism: 'bg-red-400', Base: 'bg-blue-400',
}

interface Protocol {
  name: string
  tvl: number
  change24h: number | null
  category: string
}

interface Chain {
  name: string
  tvl: number
  pct: number
}

export function CryptoDefi({
  data,
  loading,
}: {
  data: { protocols: Protocol[]; chains: Chain[] } | null
  loading: boolean
}) {
  if (loading) {
    return <div className="py-4 text-center text-[10px] text-muted-foreground">Loading...</div>
  }

  if (!data) return null

  const protocols = data.protocols
  const chains = data.chains.slice(0, 5)
  const maxTvl = Math.max(...protocols.map((p) => p.tvl), 1)
  const totalTvl = protocols.reduce((s, p) => s + p.tvl, 0)

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total DeFi TVL</span>
        <span className="text-[11px] font-semibold tabular-nums">${(totalTvl / 1e9).toFixed(1)}B</span>
      </div>

      <div className="space-y-0.5">
        <div className="flex gap-1 text-[10px] text-muted-foreground mb-1 flex-wrap">
          {chains.map((c) => (
            <span key={c.name} className="flex items-center gap-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-sm ${CHAIN_COLORS[c.name] ?? 'bg-zinc-500'}`} />
              {c.name} {c.pct}%
            </span>
          ))}
        </div>
        <div className="flex h-1.5 w-full rounded-sm overflow-hidden">
          {chains.map((c) => (
            <div key={c.name} className={`${CHAIN_COLORS[c.name] ?? 'bg-zinc-500'} h-full`} style={{ width: `${c.pct}%` }} />
          ))}
        </div>
      </div>

      <div className="space-y-0.5 pt-1">
        {protocols.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="text-[10px] w-20 shrink-0 text-foreground truncate">{p.name}</span>
            <div className="flex-1 h-1 bg-border/30 rounded-sm overflow-hidden">
              <div className="h-full bg-blue-500 rounded-sm" style={{ width: `${(p.tvl / maxTvl) * 100}%` }} />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground w-14 text-right">
              ${(p.tvl / 1e9).toFixed(1)}B
              {p.change24h != null && (
                <span className={p.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}> {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(1)}%</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
