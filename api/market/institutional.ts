import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': '*/*',
}

const SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA', 'JPM']

interface HolderEntry {
  organization: string
  pctHeld: number
  shares: number
  value: number
  reportDate: string
}

interface StockInstitutional {
  symbol: string
  institutionsPctHeld: number | null
  insidersPctHeld: number | null
  topHolders: HolderEntry[]
}

async function fetchInstitutional(symbol: string): Promise<StockInstitutional> {
  const modules = 'majorHoldersBreakdown,institutionOwnership'
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`
  const r = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(8_000) })
  if (!r.ok) throw new Error(`YF ${symbol}: ${r.status}`)
  const json = await r.json() as Record<string, unknown>
  const result = (json?.quoteSummary as Record<string, unknown>)?.result as Record<string, unknown>[] | undefined
  const data = result?.[0] ?? {}

  const breakdown = (data as Record<string, unknown>)?.majorHoldersBreakdown as Record<string, Record<string, number>> | undefined
  const ioModule = (data as Record<string, unknown>)?.institutionOwnership as Record<string, unknown> | undefined
  const ownershipList = (ioModule?.ownershipList as Record<string, unknown>[] | undefined) ?? []

  const topHolders: HolderEntry[] = ownershipList.slice(0, 5).map((h) => {
    const raw = h as Record<string, Record<string, number | string>>
    return {
      organization: String(raw.organization?.longName ?? raw.organization ?? ''),
      pctHeld: (raw.pctHeld?.raw as number | undefined) ?? 0,
      shares: (raw.position?.raw as number | undefined) ?? 0,
      value: (raw.value?.raw as number | undefined) ?? 0,
      reportDate: String(raw.reportDate?.fmt ?? ''),
    }
  })

  return {
    symbol,
    institutionsPctHeld: breakdown?.institutionsPercentHeld?.raw ?? null,
    insidersPctHeld: breakdown?.insidersPercentHeld?.raw ?? null,
    topHolders,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  try {
    const { data } = await cached('market:institutional', 3_600_000, async () => {
      const results = await Promise.allSettled(SYMBOLS.map(s => fetchInstitutional(s)))
      return results
        .filter((r): r is PromiseFulfilledResult<StockInstitutional> => r.status === 'fulfilled')
        .map(r => r.value)
    })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch institutional data' })
  }
}
