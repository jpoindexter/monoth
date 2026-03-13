import { useNewsData } from '@/hooks/use-news-data'
import { usePolling } from '@/hooks/use-polling'
import { PanelWrapper } from '@/components/layout/PanelWrapper'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`

  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}

interface CryptoPrice {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  rank: number
}

export default function BtcEtfPanel() {
  const { data: newsData, loading: newsLoading, error: newsError, refresh: refreshNews } = useNewsData('btc-etf')
  const { data: priceData, loading: priceLoading, error: priceError, refresh: refreshPrice } = usePolling<CryptoPrice[]>({
    fetcher: async () => {
      const res = await fetch('/api/crypto/prices')
      if (!res.ok) throw new Error('Failed to fetch prices')
      const prices = await res.json()
      return prices
    },
    interval: 60_000,
  })

  const btcData = priceData?.find(c => c.id === 'bitcoin')
  const loading = newsLoading || priceLoading
  const error = newsError || priceError
  const onRetry = () => {
    refreshNews()
    refreshPrice()
  }

  return (
    <PanelWrapper title="BTC ETF Tracker" loading={loading} error={error} onRetry={onRetry}>
      <div className="flex flex-col h-full">
        {btcData && (
          <div className="border-b pb-4 mb-4">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-3xl font-bold">${btcData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`text-lg font-semibold ${btcData.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {btcData.changePercent24h >= 0 ? '+' : ''}{btcData.changePercent24h.toFixed(2)}%
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {btcData.changePercent24h >= 0 ? '+' : ''}${btcData.change24h.toFixed(2)} (24h)
            </span>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-4">
            {newsData?.map((item) => (
              <div key={item.id} className="border-b pb-3 last:border-0">
                <div className="flex gap-2 items-start mb-1">
                  <Badge variant="secondary" className="text-xs shrink-0">{item.source}</Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {getRelativeTime(item.published)}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium leading-snug hover:underline text-foreground line-clamp-2"
                >
                  {item.title}
                </a>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </PanelWrapper>
  )
}
