import { ALL_CHANNELS } from './VideoChannelData'
import type { LiveChannel, Region } from './VideoChannelData'

const REGIONS: { id: Region; label: string }[] = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'latam', label: 'Latin America' },
  { id: 'asia', label: 'Asia' },
  { id: 'me', label: 'Middle East' },
  { id: 'africa', label: 'Africa' },
  { id: 'oc', label: 'Oceania' },
]

interface Props {
  enabledIds: Set<string>
  toggleChannel: (id: string) => void
  onClose: () => void
  btnCls: string
}

export function VideoChannelSettings({ enabledIds, toggleChannel, onClose, btnCls }: Props) {
  return (
    <div className="absolute inset-0 z-10 bg-background flex flex-col">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[11px] font-semibold">Live Channels</span>
        <button onClick={onClose} className={btnCls}>Done</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {REGIONS.map(r => {
          const regionChannels = ALL_CHANNELS.filter((ch: LiveChannel) => ch.region === r.id)
          return (
            <div key={r.id}>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1">{r.label}</div>
              <div className="flex flex-wrap gap-1">
                {regionChannels.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`text-[10px] px-1.5 py-0.5 rounded-sm border transition-colors ${
                      enabledIds.has(ch.id)
                        ? 'border-foreground/50 text-foreground'
                        : 'border-border/30 text-muted-foreground hover:border-border/60'
                    }`}
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
