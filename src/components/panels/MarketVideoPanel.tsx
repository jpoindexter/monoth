import { useState } from 'react'
import { PanelWrapper } from '@/components/layout/PanelWrapper'

type Tab = 'live' | 'shows' | 'trending' | 'learn'

const CHANNELS = [
  { id: 'bloomberg-tv', name: 'Bloomberg TV', desc: '24/7 business & markets', color: 'border-blue-500', live: true },
  { id: 'cnbc', name: 'CNBC', desc: 'Market coverage & analysis', color: 'border-yellow-500', live: true },
  { id: 'bloomberg-surveillance', name: 'Bloomberg Surveillance', desc: 'Morning market analysis', color: 'border-blue-400', live: false },
  { id: 'yahoo-finance', name: 'Yahoo Finance Live', desc: 'Real-time market coverage', color: 'border-purple-500', live: true },
  { id: 'fox-business', name: 'Fox Business', desc: 'Business news & market data', color: 'border-red-500', live: true },
  { id: 'cheddar', name: 'Cheddar News', desc: 'Tech & business updates', color: 'border-orange-500', live: false },
]

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

const TRENDING = [
  { id: 1, title: 'Fed signals rate cuts ahead — what it means for markets', channel: 'Bloomberg TV', views: '245K views', time: '2h ago', topic: 'Macro' },
  { id: 2, title: 'NVDA earnings breakdown: record revenue, but guidance disappoints', channel: 'CNBC', views: '189K views', time: '3h ago', topic: 'Earnings' },
  { id: 3, title: '2024 macro outlook: recession or soft landing?', channel: 'Real Vision', views: '132K views', time: '5h ago', topic: 'Macro' },
  { id: 4, title: 'Bitcoin ETF flows hit all-time high — crypto rally incoming?', channel: 'Cheddar News', views: '98K views', time: '6h ago', topic: 'Crypto' },
  { id: 5, title: 'How to trade the VIX spike: strategies for volatile markets', channel: 'Chat With Traders', views: '76K views', time: '8h ago', topic: 'Trading' },
  { id: 6, title: 'S&P 500 technical analysis: key levels to watch this week', channel: 'The Compound', views: '61K views', time: '1d ago', topic: 'Analysis' },
  { id: 7, title: 'Apple earnings preview: iPhone demand slowdown concerns', channel: 'Yahoo Finance Live', views: '55K views', time: '1d ago', topic: 'Earnings' },
  { id: 8, title: 'DeFi summer 2.0? Onchain activity surging across protocols', channel: 'Bankless', views: '47K views', time: '1d ago', topic: 'Crypto' },
  { id: 9, title: 'Oil market breakdown: OPEC cuts and geopolitical risk', channel: 'Fox Business', views: '39K views', time: '2d ago', topic: 'Commodities' },
  { id: 10, title: 'Buffett indicator hits 180%: is the market overvalued?', channel: 'Invest Like the Best', views: '31K views', time: '2d ago', topic: 'Analysis' },
]

const TRACKS = [
  { id: 1, name: 'Options Trading 101', videos: 12, difficulty: 'Beginner', progress: 0 },
  { id: 2, name: 'Technical Analysis', videos: 8, difficulty: 'Intermediate', progress: 25 },
  { id: 3, name: 'Macro Economics', videos: 10, difficulty: 'Intermediate', progress: 40 },
  { id: 4, name: 'Crypto & DeFi', videos: 15, difficulty: 'Beginner', progress: 60 },
  { id: 5, name: 'Portfolio Management', videos: 9, difficulty: 'Advanced', progress: 10 },
  { id: 6, name: 'Risk Management', videos: 7, difficulty: 'Advanced', progress: 0 },
]

const freqColors: Record<string, string> = {
  'Daily': 'bg-emerald-500/20 text-emerald-500',
  '3x/week': 'bg-blue-500/20 text-blue-400',
  '2x/week': 'bg-blue-500/15 text-blue-300',
  'Weekly': 'bg-muted text-muted-foreground',
}

const topicColors: Record<string, string> = {
  'Macro': 'bg-blue-500/20 text-blue-400',
  'Earnings': 'bg-yellow-500/20 text-yellow-500',
  'Crypto': 'bg-purple-500/20 text-purple-400',
  'Trading': 'bg-orange-500/20 text-orange-400',
  'Analysis': 'bg-emerald-500/20 text-emerald-500',
  'Commodities': 'bg-amber-500/20 text-amber-400',
}

const diffColors: Record<string, string> = {
  'Beginner': 'bg-emerald-500/20 text-emerald-500',
  'Intermediate': 'bg-yellow-500/20 text-yellow-500',
  'Advanced': 'bg-red-500/20 text-red-400',
}

export default function MarketVideoPanel() {
  const [tab, setTab] = useState<Tab>('live')

  const tabCls = (active: boolean) =>
    `text-[9px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`

  const sortedShows = [...SHOWS].sort((a, b) => a.freqOrder - b.freqOrder)

  return (
    <PanelWrapper title="Market Video">
      <div className="flex gap-1 mb-2 flex-wrap">
        <button className={tabCls(tab === 'live')} onClick={() => setTab('live')}>Live</button>
        <button className={tabCls(tab === 'shows')} onClick={() => setTab('shows')}>Shows</button>
        <button className={tabCls(tab === 'trending')} onClick={() => setTab('trending')}>Trending</button>
        <button className={tabCls(tab === 'learn')} onClick={() => setTab('learn')}>Learn</button>
      </div>

      {tab === 'live' && (
        <div className="space-y-1.5">
          {CHANNELS.map((ch) => (
            <div key={ch.id} className={`border-l-2 ${ch.color} pl-2 py-1 flex items-center justify-between`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-foreground leading-tight">{ch.name}</span>
                  {ch.live && (
                    <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider text-red-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground">{ch.desc}</div>
              </div>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ch.name + ' live')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-blue-400 hover:text-blue-300 ml-2 shrink-0"
              >
                Watch
              </a>
            </div>
          ))}
        </div>
      )}

      {tab === 'shows' && (
        <div className="space-y-1.5">
          {sortedShows.map((show) => (
            <div key={show.id} className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-foreground leading-tight">{show.name}</div>
                <div className="text-[9px] text-muted-foreground truncate">{show.host}</div>
                <div className="text-[9px] text-muted-foreground">{show.topic}</div>
              </div>
              <span className={`text-[8px] font-medium px-1 py-0.5 rounded-sm shrink-0 ${freqColors[show.freq] ?? 'bg-muted text-muted-foreground'}`}>
                {show.freq}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'trending' && (
        <div className="space-y-1.5">
          {TRENDING.map((v) => (
            <div key={v.id} className="border-t border-border/20 pt-1.5 first:border-t-0 first:pt-0">
              <div className="text-[10px] font-medium text-foreground leading-snug line-clamp-2">{v.title}</div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[9px] text-muted-foreground">{v.channel}</span>
                <span className="text-[9px] text-muted-foreground">{v.views}</span>
                <span className="text-[9px] text-muted-foreground">{v.time}</span>
                <span className={`text-[8px] px-1 py-0 rounded-sm ${topicColors[v.topic] ?? 'bg-muted text-muted-foreground'}`}>
                  {v.topic}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'learn' && (
        <div className="space-y-2">
          {TRACKS.map((track) => (
            <div key={track.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-medium text-foreground">{track.name}</span>
                <span className={`text-[8px] font-medium px-1 py-0 rounded-sm ${diffColors[track.difficulty]}`}>
                  {track.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${track.progress}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0">{track.videos} videos</span>
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">{track.progress}% complete</div>
            </div>
          ))}
        </div>
      )}
    </PanelWrapper>
  )
}
