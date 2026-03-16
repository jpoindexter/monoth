const SHOWS = [
  { id: 1, name: 'Real Vision', host: 'Real Vision', topic: 'Macro & markets', freq: 'Daily', freqOrder: 0 },
  { id: 2, name: 'The Compound', host: 'Josh Brown & Michael Batnick', topic: 'Market commentary', freq: 'Daily', freqOrder: 0 },
  { id: 3, name: 'Bankless', host: 'Ryan & David', topic: 'Crypto & DeFi', freq: '3x/week', freqOrder: 1 },
  { id: 4, name: 'Odd Lots', host: 'Bloomberg', topic: 'Economics deep dives', freq: '2x/week', freqOrder: 2 },
  { id: 5, name: 'All-In Podcast', host: 'Chamath & friends', topic: 'Tech & investing', freq: 'Weekly', freqOrder: 3 },
  { id: 6, name: 'The Prof G Pod', host: 'Scott Galloway', topic: 'Markets & tech', freq: 'Weekly', freqOrder: 3 },
  { id: 7, name: 'Invest Like the Best', host: 'Patrick OShaughnessy', topic: 'Investing frameworks', freq: 'Weekly', freqOrder: 3 },
  { id: 8, name: 'Chat With Traders', host: 'Aaron Fifield', topic: 'Trading strategies', freq: 'Weekly', freqOrder: 3 },
]

const freqColors: Record<string, string> = {
  'Daily': 'bg-emerald-500/20 text-emerald-500',
  '3x/week': 'bg-blue-500/20 text-blue-400',
  '2x/week': 'bg-blue-500/15 text-blue-300',
  'Weekly': 'bg-muted text-muted-foreground',
}

export function VideoShowsTab() {
  return (
    <div className="space-y-1.5">
      {[...SHOWS].sort((a, b) => a.freqOrder - b.freqOrder).map((show) => (
        <div key={show.id} className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-foreground">{show.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{show.host}</div>
            <div className="text-[10px] text-muted-foreground">{show.topic}</div>
          </div>
          <span className={`text-[9px] font-medium px-1 py-0.5 rounded-sm shrink-0 ${freqColors[show.freq] ?? 'bg-muted text-muted-foreground'}`}>
            {show.freq}
          </span>
        </div>
      ))}
    </div>
  )
}
