'use client'
import { useCallback, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { tabCls } from '@/lib/panel-utils'

type Tab = 'recent' | 'funds' | 'holdings'

interface Filing {
  fund: string
  cik: string
  filedDate: string
  period: string
  url: string
}

const FUND_META: Record<string, { aum: string; style: string }> = {
  'Berkshire Hathaway': { aum: '$~300B', style: 'Value / concentrated' },
  'Vanguard Group': { aum: '$~8T', style: 'Passive index' },
  'BlackRock': { aum: '$~10T', style: 'Active + passive' },
  'Fidelity Investments': { aum: '$~4.5T', style: 'Active + passive' },
  'T. Rowe Price': { aum: '$~1.3T', style: 'Active growth' },
  'Pershing Square': { aum: '$~10B', style: 'Activist / concentrated' },
  'Renaissance Technologies': { aum: '$~130B', style: 'Quantitative' },
}

const KEY_HOLDINGS = [
  { fund: 'Berkshire', ticker: 'AAPL', pct: '~40%', note: 'Largest holding' },
  { fund: 'Berkshire', ticker: 'BAC', pct: '~12%', note: 'Banking' },
  { fund: 'Berkshire', ticker: 'AXP', pct: '~8%', note: 'Financials' },
  { fund: 'Berkshire', ticker: 'KO', pct: '~7%', note: 'Consumer' },
  { fund: 'Pershing Sq.', ticker: 'HLT', pct: 'Large', note: 'Hospitality' },
  { fund: 'Pershing Sq.', ticker: 'QSR', pct: 'Large', note: 'Fast food' },
  { fund: 'Pershing Sq.', ticker: 'CP', pct: 'Large', note: 'Rail' },
  { fund: 'Pershing Sq.', ticker: 'GOOGL', pct: 'Large', note: 'Tech' },
  { fund: 'Renaissance', ticker: 'Diversified', pct: '—', note: 'Quant / broad' },
]

function fmtDate(d: string): string {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export default function InstitutionalHoldingsPanel() {
  const [tab, setTab] = useState<Tab>('recent')

  const fetcher = useCallback(async () => {
    const r = await fetch('/api/market/institutional-holdings')
    if (!r.ok) throw new Error('Failed to fetch institutional holdings')
    return r.json() as Promise<Filing[]>
  }, [])

  const { data, loading, error, refresh } = usePolling<Filing[]>({
    fetcher,
    interval: 86_400_000,
    enabled: tab === 'recent',
  })

  return (
    <PanelWrapper title="Institutional Holdings" loading={tab === 'recent' ? loading : false} error={tab === 'recent' ? error : null} onRetry={refresh}>
      <div className="flex gap-1 mb-2">
        <button className={tabCls(tab === 'recent')} onClick={() => setTab('recent')}>Recent 13F</button>
        <button className={tabCls(tab === 'funds')} onClick={() => setTab('funds')}>Funds</button>
        <button className={tabCls(tab === 'holdings')} onClick={() => setTab('holdings')}>Key Holdings</button>
      </div>

      {tab === 'recent' && (
        <div>
          <div className="text-[9px] text-muted-foreground mb-2">13F-HR filings — quarterly disclosure of equity positions &gt;$100M AUM</div>
          {(data ?? []).map((f, i) => (
            <div key={i} className="border-t border-border/15 py-1.5 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-foreground truncate">{f.fund}</div>
                <div className="text-[10px] text-muted-foreground">
                  Filed {fmtDate(f.filedDate)}{f.period ? ` · Period ${fmtDate(f.period)}` : ''}
                </div>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-amber-400 hover:text-amber-300 shrink-0 mt-0.5 uppercase tracking-wide font-medium"
              >
                SEC →
              </a>
            </div>
          ))}
          {!loading && (!data || data.length === 0) && (
            <div className="text-[10px] text-muted-foreground py-2">No filings found</div>
          )}
        </div>
      )}

      {tab === 'funds' && (
        <div>
          {Object.entries(FUND_META).map(([name, meta]) => (
            <div key={name} className="border-t border-border/15 py-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-medium text-foreground">{name}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">{meta.aum}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{meta.style}</div>
            </div>
          ))}
          <div className="mt-2 pt-1.5 border-t border-border/15">
            <span className="text-[9px] text-muted-foreground/50">AUM estimates as of 2024 · for reference only</span>
          </div>
        </div>
      )}

      {tab === 'holdings' && (
        <div>
          <div className="text-[9px] text-muted-foreground mb-2">Known major positions as of Q4 2024 (public filings)</div>
          <div className="flex items-center pb-1 gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[68px]">Fund</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[60px]">Ticker</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[38px] text-right">Wt%</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex-1">Note</span>
          </div>
          {KEY_HOLDINGS.map((h, i) => (
            <div key={i} className="flex items-center gap-1 border-t border-border/15 py-0.5">
              <span className="text-[10px] text-muted-foreground w-[68px] shrink-0 truncate">{h.fund}</span>
              <span className="text-[11px] font-bold w-[60px] shrink-0">{h.ticker}</span>
              <span className="text-[10px] tabular-nums w-[38px] text-right shrink-0 text-amber-400">{h.pct}</span>
              <span className="text-[10px] text-muted-foreground flex-1 truncate">{h.note}</span>
            </div>
          ))}
          <div className="mt-2 pt-1.5 border-t border-border/15">
            <span className="text-[9px] text-muted-foreground/50">Source: SEC 13F filings / public reports</span>
          </div>
        </div>
      )}
    </PanelWrapper>
  )
}
