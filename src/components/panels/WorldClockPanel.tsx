import { useState, useEffect } from 'react'
import { PanelWrapper, useIsExpanded } from '@/components/layout/PanelWrapper'
import { WorldClockClocksTab } from './WorldClockClocksTab'
import { WorldClockConvertTab } from './WorldClockConvertTab'
import { WorldClockOverlapTab } from './WorldClockOverlapTab'

type Tab = 'clocks' | 'convert' | 'overlap'

const tabs: { id: Tab; label: string }[] = [
  { id: 'clocks', label: 'Clocks' },
  { id: 'convert', label: 'Convert' },
  { id: 'overlap', label: 'Overlap' },
]

export default function WorldClockPanel() {
  const expanded = useIsExpanded()
  const [, setNow] = useState(Date.now())
  const [tab, setTab] = useState<Tab>('clocks')

  useEffect(() => {
    const interval = expanded && tab === 'clocks' ? 1_000 : 60_000
    const timer = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(timer)
  }, [expanded, tab])

  return (
    <PanelWrapper title="World Clock">
      <div className="flex gap-0.5 mb-2 border-b border-border/20 pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm transition-colors ${
              tab === t.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'clocks' && <WorldClockClocksTab />}
      {tab === 'convert' && <WorldClockConvertTab />}
      {tab === 'overlap' && <WorldClockOverlapTab />}
    </PanelWrapper>
  )
}
