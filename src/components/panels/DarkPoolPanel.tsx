'use client'
import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { tabCls, fmtVol } from '@/lib/panel-utils'

type Tab = 'prints' | 'volume' | 'info'

interface DarkPrint {
  time: string
  symbol: string
  size: number
  price: number
  notional: number
  exchange: string
}

const SAMPLE_PRINTS: DarkPrint[] = [
  { time: '09:47', symbol: 'NVDA',  size: 250_000, price: 875.50,  notional: 218_875_000, exchange: 'FINRA ADF' },
  { time: '09:52', symbol: 'AAPL',  size: 500_000, price: 182.30,  notional:  91_150_000, exchange: 'FINRA ADF' },
  { time: '10:04', symbol: 'SPY',   size: 800_000, price: 452.10,  notional: 361_680_000, exchange: 'FINRA ADF' },
  { time: '10:11', symbol: 'MSFT',  size: 175_000, price: 378.20,  notional:  66_185_000, exchange: 'FINRA ADF' },
  { time: '10:18', symbol: 'TSLA',  size: 320_000, price: 238.40,  notional:  76_288_000, exchange: 'FINRA ADF' },
  { time: '10:24', symbol: 'QQQ',   size: 600_000, price: 385.90,  notional: 231_540_000, exchange: 'FINRA ADF' },
  { time: '10:31', symbol: 'META',  size: 120_000, price: 498.70,  notional:  59_844_000, exchange: 'FINRA ADF' },
  { time: '10:39', symbol: 'AMZN',  size: 210_000, price: 178.50,  notional:  37_485_000, exchange: 'FINRA ADF' },
  { time: '10:47', symbol: 'AMD',   size: 450_000, price: 152.30,  notional:  68_535_000, exchange: 'FINRA ADF' },
  { time: '10:55', symbol: 'SPY',   size: 1_200_000, price: 451.80, notional: 542_160_000, exchange: 'FINRA ADF' },
  { time: '11:03', symbol: 'COIN',  size: 85_000,  price: 218.40,  notional:  18_564_000, exchange: 'FINRA ADF' },
  { time: '11:12', symbol: 'NVDA',  size: 180_000, price: 877.20,  notional: 157_896_000, exchange: 'FINRA ADF' },
  { time: '11:21', symbol: 'MSFT',  size: 220_000, price: 379.10,  notional:  83_402_000, exchange: 'FINRA ADF' },
  { time: '11:34', symbol: 'QQQ',   size: 750_000, price: 386.40,  notional: 289_800_000, exchange: 'FINRA ADF' },
  { time: '11:48', symbol: 'AAPL',  size: 400_000, price: 183.10,  notional:  73_240_000, exchange: 'FINRA ADF' },
  { time: '12:02', symbol: 'TSLA',  size: 280_000, price: 237.90,  notional:  66_612_000, exchange: 'FINRA ADF' },
  { time: '12:14', symbol: 'META',  size: 95_000,  price: 499.20,  notional:  47_424_000, exchange: 'FINRA ADF' },
  { time: '12:28', symbol: 'AMZN',  size: 340_000, price: 179.20,  notional:  60_928_000, exchange: 'FINRA ADF' },
  { time: '12:41', symbol: 'AMD',   size: 520_000, price: 153.10,  notional:  79_612_000, exchange: 'FINRA ADF' },
  { time: '13:05', symbol: 'SPY',   size: 950_000, price: 453.20,  notional: 430_540_000, exchange: 'FINRA ADF' },
]

function fmtNotional(n: number): string {
  return `$${(n / 1_000_000).toFixed(1)}M`
}

function bySymbol(): { symbol: string; total: number }[] {
  const map: Record<string, number> = {}
  for (const p of SAMPLE_PRINTS) {
    map[p.symbol] = (map[p.symbol] ?? 0) + p.notional
  }
  return Object.entries(map)
    .map(([symbol, total]) => ({ symbol, total }))
    .sort((a, b) => b.total - a.total)
}

export default function DarkPoolPanel() {
  const [tab, setTab] = useState<Tab>('prints')

  const volData = bySymbol()
  const maxVol = volData[0]?.total ?? 1

  return (
    <PanelWrapper title="Dark Pool">
      <div className="flex gap-1 mb-1">
        <button className={tabCls(tab === 'prints')} onClick={() => setTab('prints')}>Prints</button>
        <button className={tabCls(tab === 'volume')} onClick={() => setTab('volume')}>Volume</button>
        <button className={tabCls(tab === 'info')} onClick={() => setTab('info')}>Info</button>
      </div>

      <div className="text-[9px] text-amber-400/80 bg-amber-500/10 rounded-sm px-2 py-1 mb-2 leading-snug">
        Sample data — live dark pool feed requires Unusual Whales or similar paid service
      </div>

      {tab === 'prints' && (
        <div>
          <div className="flex items-center pb-1 gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[34px]">Time</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[40px]">Sym</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[52px] text-right">Size</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[52px] text-right">Price</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-[52px] text-right">Notional</span>
          </div>
          {SAMPLE_PRINTS.map((p, i) => {
            const large = p.notional >= 100_000_000
            return (
              <div key={i} className={`flex items-center gap-1 border-t border-border/15 py-0.5 ${large ? 'bg-amber-500/5' : ''}`}>
                <span className="text-[10px] tabular-nums text-muted-foreground w-[34px] shrink-0">{p.time}</span>
                <span className={`text-[11px] font-bold w-[40px] shrink-0 ${large ? 'text-amber-400' : 'text-foreground'}`}>{p.symbol}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground w-[52px] text-right shrink-0">
                  {fmtVol(p.size)}
                </span>
                <span className="text-[10px] tabular-nums w-[52px] text-right shrink-0">
                  ${p.price.toFixed(2)}
                </span>
                <span className={`text-[10px] tabular-nums font-medium w-[52px] text-right shrink-0 ${large ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {fmtNotional(p.notional)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'volume' && (
        <div>
          <div className="text-[9px] text-muted-foreground mb-2">Dark pool notional volume by symbol (sample)</div>
          {volData.map(({ symbol, total }) => (
            <div key={symbol} className="mb-1.5">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[11px] font-bold text-foreground">{symbol}</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">{fmtNotional(total)}</span>
              </div>
              <div className="w-full bg-muted/30 rounded-sm h-2">
                <div
                  className="h-2 rounded-sm bg-amber-500/60"
                  style={{ width: `${(total / maxVol) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'info' && (
        <div className="flex flex-col gap-2 text-[10px]">
          <div>
            <div className="text-[10px] font-semibold text-foreground mb-0.5">What are dark pools?</div>
            <div className="text-muted-foreground leading-snug">
              Dark pools are private exchanges where large institutional orders are matched off the public exchange. They let big players buy/sell large blocks without moving the market price.
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-foreground mb-0.5">Why they matter</div>
            <div className="text-muted-foreground leading-snug">
              Large dark pool prints can signal institutional conviction. A $200M+ print in a stock often precedes meaningful price movement. Retail traders watch for unusual dark pool activity as a directional signal.
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-foreground mb-0.5">Data sources (paid)</div>
            <div className="flex flex-col gap-1 text-muted-foreground">
              <a href="https://unusualwhales.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">unusualwhales.com</a>
              <a href="https://darkpool.io" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">darkpool.io</a>
              <span className="text-[9px] text-muted-foreground/60">FINRA reports aggregate dark pool volume with a T+1 delay for free via finra.org</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-foreground mb-0.5">How prints are reported</div>
            <div className="text-muted-foreground leading-snug">
              Off-exchange trades are reported to FINRA ADF (Alternative Display Facility) or a TRF (Trade Reporting Facility). Side (buy/sell) is not disclosed — it is inferred from price vs. bid/ask.
            </div>
          </div>
        </div>
      )}
    </PanelWrapper>
  )
}
