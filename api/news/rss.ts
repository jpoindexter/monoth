import type { VercelRequest, VercelResponse } from '@vercel/node'
import { XMLParser } from 'fast-xml-parser'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'
import { getFeedUrls, CATEGORIES } from './_feed-urls.js'

const parser = new XMLParser({ ignoreAttributes: false })

function parseRSSItems(xml: string, sourceName: string, category: string) {
  const parsed = parser.parse(xml)
  const items =
    parsed?.rss?.channel?.item ??
    parsed?.feed?.entry ??
    []
  const itemArray = Array.isArray(items) ? items : [items]

  return itemArray.map((item: any, idx: number) => {
    const url = typeof item.link === 'string'
      ? item.link
      : item.link?.['@_href'] ?? ''
    const guidStr = typeof item.guid === 'string'
      ? item.guid
      : item.guid?.['#text'] ?? url
    // Include source + index so IDs are globally unique even when feeds share GUIDs
    const idSeed = `${sourceName}:${idx}:${guidStr || url}`

    return {
      id: Buffer.from(idSeed).toString('base64').slice(0, 32),
      title: item.title ?? '',
      url,
      source: sourceName,
      published: new Date(item.pubDate ?? item.published ?? 0).getTime(),
      category,
    }
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return
  const category = req.query.category as string
  const region = (req.query.region as string) || 'global'

  if (!category || !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' })
  }

  try {
    const { data, stale } = await cached(`news:${category}:${region}`, 300_000, async () => {
      const feeds = getFeedUrls(category, region)
      const results = await Promise.allSettled(
        feeds.map(async ({ name, url }) => {
          const r = await fetch(url, { headers: { 'User-Agent': 'Monoth/1.0' } })
          if (!r.ok) return []
          const xml = await r.text()
          return parseRSSItems(xml, name, category)
        })
      )
      const allItems = results
        .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)

      const seen = new Set<string>()
      return allItems
        .filter((item) => {
          if (seen.has(item.url)) return false
          seen.add(item.url)
          return true
        })
        .sort((a, b) => b.published - a.published)
        .slice(0, 50)
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch news' })
  }
}
