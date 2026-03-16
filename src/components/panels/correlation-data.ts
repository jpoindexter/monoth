export const ASSETS = ['SPY', 'GLD', 'TLT', 'DXY', 'BTC']

export const STATIC_CORRELATIONS: Record<string, Record<string, number>> = {
  'SPY': { SPY: 1.0, GLD: -0.15, TLT: -0.35, DXY: -0.20, BTC: 0.45 },
  'GLD': { SPY: -0.15, GLD: 1.0, TLT: 0.25, DXY: -0.55, BTC: 0.10 },
  'TLT': { SPY: -0.35, TLT: 1.0, GLD: 0.25, DXY: -0.10, BTC: -0.15 },
  'DXY': { SPY: -0.20, GLD: -0.55, TLT: -0.10, DXY: 1.0, BTC: -0.30 },
  'BTC': { SPY: 0.45, GLD: 0.10, TLT: -0.15, DXY: -0.30, BTC: 1.0 },
}

export const ROLLING_HISTORY: { pair: string; w1: number; m1: number; m3: number; m6: number }[] = [
  { pair: 'SPY-TLT', w1: -0.42, m1: -0.38, m3: -0.35, m6: -0.28 },
  { pair: 'SPY-GLD', w1: -0.08, m1: -0.12, m3: -0.15, m6: -0.22 },
  { pair: 'BTC-SPY', w1: 0.51, m1: 0.47, m3: 0.45, m6: 0.38 },
  { pair: 'DXY-GLD', w1: -0.58, m1: -0.54, m3: -0.55, m6: -0.51 },
]

export const ASSETS_EXPANDED = ['SPY', 'GLD', 'TLT', 'DXY', 'BTC', 'OIL', 'VIX', 'EEM']

export const STATIC_CORRELATIONS_EXPANDED: Record<string, Record<string, number>> = {
  ...Object.fromEntries(
    ASSETS_EXPANDED.map((a) => [
      a,
      Object.fromEntries(
        ASSETS_EXPANDED.map((b) => {
          const base = STATIC_CORRELATIONS[a]?.[b]
          if (base != null) return [b, base]
          const extras: Record<string, Record<string, number>> = {
            OIL: { SPY: 0.22, GLD: 0.30, TLT: -0.18, DXY: -0.28, BTC: 0.15, OIL: 1.0, VIX: -0.35, EEM: 0.38 },
            VIX: { SPY: -0.82, GLD: 0.20, TLT: 0.40, DXY: 0.10, BTC: -0.45, OIL: -0.35, VIX: 1.0, EEM: -0.70 },
            EEM: { SPY: 0.75, GLD: 0.05, TLT: -0.30, DXY: -0.50, BTC: 0.40, OIL: 0.38, VIX: -0.70, EEM: 1.0 },
          }
          return [b, extras[a]?.[b] ?? extras[b]?.[a] ?? 0]
        })
      ),
    ])
  ),
}

export function correlationColor(val: number): string {
  if (val > 0.6) return 'bg-emerald-600 text-white'
  if (val > 0.3) return 'bg-emerald-400/60 text-foreground'
  if (val > 0.1) return 'bg-emerald-200/40 text-foreground'
  if (val > -0.1) return 'bg-muted text-muted-foreground'
  if (val > -0.3) return 'bg-red-200/40 text-foreground'
  if (val > -0.6) return 'bg-red-400/60 text-foreground'
  return 'bg-red-600 text-white'
}

export function directionColor(value: number): string {
  if (value === 0) return 'bg-muted text-muted-foreground'
  const intensity = Math.min(Math.abs(value), 1)
  const alpha = Math.round(intensity * 100)
  if (value > 0) {
    if (alpha >= 70) return 'bg-emerald-600 text-white'
    if (alpha >= 40) return 'bg-emerald-500/60 text-white'
    return 'bg-emerald-500/30 text-emerald-900'
  }
  if (alpha >= 70) return 'bg-red-600 text-white'
  if (alpha >= 40) return 'bg-red-500/60 text-white'
  return 'bg-red-500/30 text-red-900'
}

export function rollingCellCls(val: number): string {
  if (val <= -0.5) return 'bg-emerald-600 text-white'
  if (val <= -0.2) return 'bg-emerald-400/60 text-foreground'
  if (val < 0.2) return 'bg-muted text-muted-foreground'
  if (val < 0.5) return 'bg-red-400/60 text-foreground'
  return 'bg-red-600 text-white'
}

export function computeRegime(assets: string[], corr: Record<string, Record<string, number>>) {
  const pairs: { a: string; b: string; val: number }[] = []
  let sum = 0
  let count = 0

  for (const row of assets) {
    for (const col of assets) {
      if (row >= col) continue
      const val = corr[row]?.[col] ?? 0
      pairs.push({ a: row, b: col, val })
      sum += Math.abs(val)
      count++
    }
  }

  const avg = count > 0 ? sum / count : 0
  const sorted = [...pairs].sort((x, y) => y.val - x.val)
  const highest = sorted[0]!
  const lowest = sorted[sorted.length - 1]!

  let regime: 'RISK-ON' | 'RISK-OFF' | 'TRANSITIONAL'
  if (avg < 0.4) regime = 'RISK-ON'
  else if (avg > 0.6) regime = 'RISK-OFF'
  else regime = 'TRANSITIONAL'

  const divScore = Math.round((1 - avg) * 100)

  return { avg, regime, highest, lowest, divScore }
}
