import type { VercelRequest, VercelResponse } from '@vercel/node'
import { XMLParser } from 'fast-xml-parser'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const channelId = req.query.channelId as string
  if (!channelId || !/^UC[\w-]{22}$/.test(channelId)) {
    return res.status(400).json({ error: 'Invalid channelId' })
  }

  try {
    const { data, stale } = await cached(`youtube:${channelId}`, 900_000, async () => {
      const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      const r = await fetch(url, { headers: { 'User-Agent': 'Monoth/1.0' } })
      if (!r.ok) throw new Error(`YouTube feed returned ${r.status}`)
      const xml = await r.text()
      const parsed = parser.parse(xml)
      const entries = parsed?.feed?.entry ?? []
      const entryArray = Array.isArray(entries) ? entries : [entries]

      const videos = entryArray.map((entry: {
        'yt:videoId'?: string
        id?: string
        title?: string
        published?: string
        link?: { '@_href'?: string }
      }) => {
        const rawId: string = entry['yt:videoId'] ?? entry.id ?? ''
        const videoId = rawId.replace('yt:video:', '')
        const link = entry.link?.['@_href'] ?? `https://www.youtube.com/watch?v=${videoId}`
        return {
          id: videoId,
          title: entry.title ?? '',
          published: entry.published ?? '',
          url: link,
        }
      })

      return { videos }
    })

    if (stale) res.setHeader('X-Cache', 'STALE')
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch YouTube feed' })
  }
}
