import { useIsExpanded } from '@/components/layout/PanelWrapper'
import { Sparkline } from '@/components/charts/Sparkline'
import type { CryptoAsset } from '@/types'

function fmtCap(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T'
  if (num >= 1e9)  return '$' + (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6)  return '$' + (num / 1e6).toFixed(1) + 'M'
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtVol(num: number): string {
  if (num >= 1e12) return '$' + (num / 1e12).toFixed(1) + 'T'
  if (num >= 1e9)  return '$' + (num / 1e9).toFixed(1) + 'B'
  if (num >= 1e6)  return '$' + (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3)  return '$' + (num / 1e3).toFixed(0) + 'K'
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function CryptoTop15({ data }: { data: CryptoAsset[] }) {
  const expanded = useIsExpanded()

  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="text-muted-foreground">
          <th className="text-left font-medium pb-1.5">#</th>
          <th className="text-left font-medium pb-1.5">Name</th>
          <th className="text-right font-medium pb-1.5">Price</th>
          <th className="text-right font-medium pb-1.5">Vol 24h</th>
          <th className="text-right font-medium pb-1.5">7d</th>
          <th className="text-right font-medium pb-1.5">24h</th>
          <th className="text-right font-medium pb-1.5">MCap</th>
        </tr>
      </thead>
      <tbody>
        {data.slice(0, expanded ? undefined : 15).map((c) => {
          const isPositive = c.changePercent24h >= 0
          return (
            <tr key={c.id} className="border-t border-border/20">
              <td className="py-0.5 tabular-nums text-muted-foreground">{c.rank}</td>
              <td className="py-0.5">
                <span className="font-medium text-foreground">{c.symbol.toUpperCase()}</span>
              </td>
              <td className="text-right tabular-nums">
                ${c.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="text-right tabular-nums text-muted-foreground">
                {fmtVol(c.volume24h)}
              </td>
              <td className="text-right">
                <div className="flex justify-end">
                  <Sparkline data={c.sparkline ?? []} />
                </div>
              </td>
              <td className={`text-right tabular-nums font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{c.changePercent24h.toFixed(2)}%
              </td>
              <td className="text-right tabular-nums text-muted-foreground">
                {fmtCap(c.marketCap)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
