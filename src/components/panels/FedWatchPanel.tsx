import { useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { tabCls, fmt } from '@/lib/panel-utils'

interface MeetingProb {
  date: string
  label: string
  probabilities: { rate: string; prob: number }[]
}

interface FedWatchData {
  currentRate: { lower: number; upper: number }
  meetings: MeetingProb[]
  rateHistory: { date: string; value: number }[]
}

type Tab = 'probabilities' | 'history' | 'context'

function rateLabel(lower: number, upper: number): string {
  if (lower === 0 && upper === 0) return '—'
  return `${fmt(lower, 2)}–${fmt(upper, 2)}%`
}

function barColor(rate: string, currentUpper: number): string {
  const parsed = parseFloat(rate)
  if (isNaN(parsed)) return 'bg-zinc-600'
  if (parsed < currentUpper - 0.1) return 'bg-emerald-500'
  if (parsed > currentUpper + 0.1) return 'bg-red-500'
  return 'bg-zinc-500'
}

function ProbabilityRow({ meeting, currentUpper }: { meeting: MeetingProb; currentUpper: number }) {
  const sorted = [...meeting.probabilities].sort((a, b) => b.prob - a.prob)
  return (
    <div className="border-t border-border/15 pt-1.5 pb-1">
      <div className="text-[10px] font-medium text-foreground mb-1">{meeting.label}</div>
      <div className="space-y-0.5">
        {sorted.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[9px] tabular-nums text-muted-foreground w-[52px] shrink-0">{p.rate}%</span>
            <div className="flex-1 bg-zinc-800 rounded-[2px] h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-[2px] transition-all ${barColor(p.rate, currentUpper)}`}
                style={{ width: `${Math.min(p.prob, 100)}%` }}
              />
            </div>
            <span className="text-[9px] tabular-nums text-muted-foreground w-[28px] text-right shrink-0">
              {fmt(p.prob, 1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RateHistory({ history }: { history: { date: string; value: number }[] }) {
  if (history.length === 0) {
    return <div className="py-4 text-center text-[10px] text-muted-foreground">No history available</div>
  }

  const maxVal = Math.max(...history.map((h) => h.value))
  const minVal = Math.min(...history.map((h) => h.value))
  const range = maxVal - minVal || 1

  const deduped: { date: string; value: number }[] = []
  for (const h of history) {
    if (deduped.length === 0 || deduped[deduped.length - 1]?.value !== h.value) {
      deduped.push(h)
    }
  }

  return (
    <div className="space-y-0.5 pt-1">
      {deduped.map((h, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[9px] tabular-nums text-muted-foreground w-[64px] shrink-0">
            {h.date.slice(0, 7)}
          </span>
          <div className="flex-1 bg-zinc-800 rounded-[2px] h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500/60 rounded-[2px]"
              style={{ width: `${((h.value - minVal) / range) * 80 + 20}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-foreground w-[32px] text-right shrink-0">
            {fmt(h.value, 2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function contextLabel(meetings: MeetingProb[], currentUpper: number): { label: string; cls: string; desc: string } {
  if (meetings.length === 0) {
    return { label: 'NEUTRAL', cls: 'text-zinc-400', desc: 'CME meeting data unavailable.' }
  }
  const next = meetings[0]
  if (!next) return { label: 'NEUTRAL', cls: 'text-zinc-400', desc: 'CME meeting data unavailable.' }
  if (!next.probabilities.length) {
    return { label: 'NEUTRAL', cls: 'text-zinc-400', desc: 'Insufficient probability data.' }
  }
  const cutProb = next.probabilities
    .filter((p) => parseFloat(p.rate) < currentUpper - 0.1)
    .reduce((sum, p) => sum + p.prob, 0)
  const hikeProb = next.probabilities
    .filter((p) => parseFloat(p.rate) > currentUpper + 0.1)
    .reduce((sum, p) => sum + p.prob, 0)
  const holdProb = 100 - cutProb - hikeProb

  if (cutProb > 50) return { label: 'DOVISH', cls: 'text-emerald-400', desc: `Markets pricing ${fmt(cutProb, 0)}% chance of a cut at ${next.label}.` }
  if (hikeProb > 30) return { label: 'HAWKISH', cls: 'text-red-400', desc: `Markets pricing ${fmt(hikeProb, 0)}% chance of a hike at ${next.label}.` }
  return { label: 'NEUTRAL', cls: 'text-amber-400', desc: `Hold probability ${fmt(holdProb, 0)}% at ${next.label}. Market expects status quo.` }
}

export default function FedWatchPanel() {
  const expanded = useIsExpanded()
  const [tab, setTab] = useState<Tab>('probabilities')

  const { data, loading, error, refresh } = usePolling<FedWatchData>({
    fetcher: async () => {
      const res = await fetch('/api/macro/fedwatch')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    interval: 3_600_000,
  })

  const currentUpper = data?.currentRate?.upper ?? 0
  const currentLower = data?.currentRate?.lower ?? 0
  const meetings = data?.meetings ?? []
  const history = data?.rateHistory ?? []
  const cmeUnavailable = meetings.length === 0

  const regime = data ? contextLabel(meetings, currentUpper) : null
  const visibleMeetings = expanded ? meetings : meetings.slice(0, 3)

  return (
    <PanelWrapper title="Fed Watch" loading={loading} error={error} onRetry={refresh}>
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'probabilities')} onClick={() => setTab('probabilities')}>Probabilities</button>
        <button className={tabCls(tab === 'history')} onClick={() => setTab('history')}>Rate History</button>
        <button className={tabCls(tab === 'context')} onClick={() => setTab('context')}>Context</button>
      </div>

      {tab === 'probabilities' && (
        <>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-[18px] font-bold tabular-nums text-foreground leading-none">
              {rateLabel(currentLower, currentUpper)}
            </span>
            <span className="text-[10px] text-muted-foreground">Fed Funds Target</span>
          </div>

          {cmeUnavailable && (
            <div className="text-[10px] text-amber-400 mb-2">
              CME data unavailable — showing current rate only
            </div>
          )}

          {!cmeUnavailable && (
            <div className="space-y-0">
              {visibleMeetings.map((m, i) => (
                <ProbabilityRow key={i} meeting={m} currentUpper={currentUpper} />
              ))}
              {!expanded && meetings.length > visibleMeetings.length && (
                <div className="text-[10px] text-muted-foreground pt-1">
                  {meetings.length - visibleMeetings.length} more meetings — expand panel
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <RateHistory history={history} />
      )}

      {tab === 'context' && (
        <div className="space-y-3 pt-1">
          {regime && (
            <div className="flex items-center gap-2">
              <span className={`text-[13px] font-bold tracking-wider ${regime.cls}`}>{regime.label}</span>
              <span className="text-[9px] text-muted-foreground">current regime</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {regime?.desc}
          </p>
          <div className="border-t border-border/20 pt-2 space-y-1.5">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              CME FedWatch tracks the implied probability of Fed Funds rate changes using 30-Day Fed Funds futures contracts. Each bar represents the market-implied probability of a specific rate outcome at the next FOMC meeting.
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="text-emerald-400 font-medium">Green</span> = rate cut implied.{' '}
              <span className="text-red-400 font-medium">Red</span> = rate hike implied.{' '}
              <span className="text-zinc-400 font-medium">Gray</span> = hold.
            </p>
          </div>
          <div className="border-t border-border/20 pt-2">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">Current Target</div>
            <div className="text-[13px] font-bold tabular-nums text-foreground">
              {rateLabel(currentLower, currentUpper)}
            </div>
          </div>
        </div>
      )}
    </PanelWrapper>
  )
}
