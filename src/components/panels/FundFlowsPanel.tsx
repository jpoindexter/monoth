

import { useState } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'

// Seeded deterministic data — stable per calendar day
function seed(base: number): number {
  const day = Math.floor(Date.now() / 86_400_000)
  const x = Math.sin(base * 9301 + day * 49297 + 233720) * 10000
  return x - Math.floor(x)
}

function rng(base: number, min: number, max: number): number {
  return min + seed(base) * (max - min)
}

interface EtfFlow {
  ticker: string
  name: string
  flow1d: number
  flow1w: number
  aum: number
}

interface SectorFlow {
  ticker: string
  sector: string
  flow1d: number
}

interface ThemeFlow {
  theme: string
  ticker: string
  flow1d: number
  flowYtd: number
}

const ETF_BASE: { ticker: string; name: string; aumBase: number }[] = [
  { ticker: 'SPY', name: 'S&P 500 ETF', aumBase: 520 },
  { ticker: 'QQQ', name: 'Nasdaq-100 ETF', aumBase: 230 },
  { ticker: 'IWM', name: 'Russell 2000 ETF', aumBase: 58 },
  { ticker: 'GLD', name: 'Gold ETF', aumBase: 62 },
  { ticker: 'TLT', name: '20+ Yr Treasury ETF', aumBase: 48 },
  { ticker: 'VNQ', name: 'Real Estate ETF', aumBase: 33 },
  { ticker: 'XLF', name: 'Financials ETF', aumBase: 44 },
  { ticker: 'HYG', name: 'High Yield Corp Bond', aumBase: 18 },
  { ticker: 'EFA', name: 'Intl Developed Mkt', aumBase: 52 },
  { ticker: 'EEM', name: 'Emerging Markets ETF', aumBase: 24 },
]

const ETF_FLOWS: EtfFlow[] = ETF_BASE.map((e, i) => ({
  ticker: e.ticker,
  name: e.name,
  flow1d: parseFloat((rng(i * 3 + 1, -800, 1200)).toFixed(0)),
  flow1w: parseFloat((rng(i * 3 + 2, -2500, 4000)).toFixed(0)),
  aum: parseFloat((e.aumBase + rng(i * 3 + 3, -2, 2)).toFixed(1)),
})).sort((a, b) => Math.abs(b.flow1d) - Math.abs(a.flow1d))

const SECTOR_BASE: { ticker: string; sector: string }[] = [
  { ticker: 'XLK', sector: 'Technology' },
  { ticker: 'XLF', sector: 'Financials' },
  { ticker: 'XLV', sector: 'Health Care' },
  { ticker: 'XLE', sector: 'Energy' },
  { ticker: 'XLI', sector: 'Industrials' },
  { ticker: 'XLY', sector: 'Cons. Discretionary' },
  { ticker: 'XLP', sector: 'Cons. Staples' },
  { ticker: 'XLU', sector: 'Utilities' },
  { ticker: 'XLB', sector: 'Materials' },
  { ticker: 'XLRE', sector: 'Real Estate' },
]

const SECTOR_FLOWS: SectorFlow[] = SECTOR_BASE.map((s, i) => ({
  ticker: s.ticker,
  sector: s.sector,
  flow1d: parseFloat((rng(i * 7 + 11, -450, 600)).toFixed(0)),
}))

const THEME_BASE: { theme: string; ticker: string }[] = [
  { theme: 'AI & Technology', ticker: 'AIQ' },
  { theme: 'Semiconductors', ticker: 'SOXX' },
  { theme: 'Clean Energy', ticker: 'ICLN' },
  { theme: 'Cybersecurity', ticker: 'HACK' },
  { theme: 'ARK Innovation', ticker: 'ARKK' },
  { theme: 'Biotech', ticker: 'IBB' },
  { theme: 'Space Exploration', ticker: 'UFO' },
  { theme: 'Robotics & AI', ticker: 'ROBO' },
  { theme: 'Cannabis', ticker: 'MJ' },
  { theme: 'Nuclear Energy', ticker: 'URA' },
]

const THEME_FLOWS: ThemeFlow[] = THEME_BASE.map((t, i) => ({
  theme: t.theme,
  ticker: t.ticker,
  flow1d: parseFloat((rng(i * 5 + 20, -300, 500)).toFixed(0)),
  flowYtd: parseFloat((rng(i * 5 + 21, -2000, 3500)).toFixed(0)),
}))

function fmtFlow(val: number): string {
  const abs = Math.abs(val)
  const prefix = val >= 0 ? '+' : '-'
  if (abs >= 1000) return `${prefix}$${(abs / 1000).toFixed(1)}B`
  return `${prefix}$${abs.toFixed(0)}M`
}

function flowColor(val: number): string {
  return val >= 0 ? 'text-emerald-500' : 'text-red-500'
}

const MAX_SECTOR_ABS = Math.max(...SECTOR_FLOWS.map(s => Math.abs(s.flow1d)))

function EtfFlowsTab() {
  const expanded = useIsExpanded()
  const rows = expanded ? ETF_FLOWS : ETF_FLOWS.slice(0, 7)

  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-x-1 px-1 mb-1">
        {['Ticker', 'Name', '1D Flow', '1W Flow', 'AUM'].map(h => (
          <div key={h} className="text-[9px] uppercase tracking-wider text-muted-foreground">{h}</div>
        ))}
      </div>
      {rows.map((etf) => (
        <div key={etf.ticker} className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-x-1 px-1 py-0.5 rounded-sm hover:bg-foreground/5">
          <div className="text-[10px] font-bold text-foreground">{etf.ticker}</div>
          <div className="text-[10px] text-muted-foreground truncate">{etf.name}</div>
          <div className={`text-[10px] font-medium tabular-nums ${flowColor(etf.flow1d)}`}>{fmtFlow(etf.flow1d)}</div>
          <div className={`text-[10px] tabular-nums ${flowColor(etf.flow1w)}`}>{fmtFlow(etf.flow1w)}</div>
          <div className="text-[10px] tabular-nums text-muted-foreground">${etf.aum}B</div>
        </div>
      ))}
    </div>
  )
}

function SectorTab() {
  const expanded = useIsExpanded()
  const sorted = [...SECTOR_FLOWS].sort((a, b) => b.flow1d - a.flow1d)

  return (
    <div className="space-y-1">
      {sorted.map((s) => {
        const pct = (s.flow1d / MAX_SECTOR_ABS) * 100
        const positive = s.flow1d >= 0
        return (
          <div key={s.ticker} className={expanded ? 'space-y-0.5' : ''}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 w-[120px] shrink-0">
                <span className="text-[9px] font-bold text-foreground w-10 shrink-0">{s.ticker}</span>
                <span className="text-[9px] text-muted-foreground truncate">{s.sector}</span>
              </div>
              <div className="flex-1 flex items-center gap-1">
                {positive ? (
                  <>
                    <div className="w-1/2 flex justify-end">
                      <div className="h-3 rounded-sm bg-border/10" style={{ width: '100%' }} />
                    </div>
                    <div className="w-1/2">
                      <div
                        className="h-3 rounded-sm bg-emerald-500/60"
                        style={{ width: `${Math.abs(pct)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-1/2 flex justify-end">
                      <div
                        className="h-3 rounded-sm bg-red-500/60"
                        style={{ width: `${Math.abs(pct)}%` }}
                      />
                    </div>
                    <div className="w-1/2">
                      <div className="h-3 rounded-sm bg-border/10" style={{ width: '100%' }} />
                    </div>
                  </>
                )}
              </div>
              <div className={`text-[10px] tabular-nums font-medium w-14 text-right shrink-0 ${flowColor(s.flow1d)}`}>
                {fmtFlow(s.flow1d)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ThemesTab() {
  const expanded = useIsExpanded()
  const rows = expanded ? THEME_FLOWS : THEME_FLOWS.slice(0, 7)

  return (
    <div className="space-y-0.5">
      <div className="grid grid-cols-[3fr_2fr_1fr_1fr] gap-x-1 px-1 mb-1">
        {['Theme', 'Ticker', '1D Flow', 'YTD Flow'].map(h => (
          <div key={h} className="text-[9px] uppercase tracking-wider text-muted-foreground">{h}</div>
        ))}
      </div>
      {rows.map((t) => (
        <div key={t.ticker} className="grid grid-cols-[3fr_2fr_1fr_1fr] gap-x-1 px-1 py-0.5 rounded-sm hover:bg-foreground/5">
          <div className="text-[10px] text-foreground truncate">{t.theme}</div>
          <div className="text-[10px] font-bold text-foreground">{t.ticker}</div>
          <div className={`text-[10px] tabular-nums font-medium ${flowColor(t.flow1d)}`}>{fmtFlow(t.flow1d)}</div>
          <div className={`text-[10px] tabular-nums ${flowColor(t.flowYtd)}`}>{fmtFlow(t.flowYtd)}</div>
        </div>
      ))}
    </div>
  )
}

export default function FundFlowsPanel() {
  const [tab, setTab] = useState<'etf' | 'sector' | 'themes'>('etf')

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  return (
    <PanelWrapper title="Fund Flows">
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'etf')} onClick={() => setTab('etf')}>ETF Flows</button>
        <button className={tabCls(tab === 'sector')} onClick={() => setTab('sector')}>Sector</button>
        <button className={tabCls(tab === 'themes')} onClick={() => setTab('themes')}>Themes</button>
      </div>

      {tab === 'etf' && <EtfFlowsTab />}
      {tab === 'sector' && <SectorTab />}
      {tab === 'themes' && <ThemesTab />}
    </PanelWrapper>
  )
}
