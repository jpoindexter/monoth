import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

// Channel IDs for live stream resolution
const CHANNEL_IDS: Record<string, string> = {
  BloombergTV: 'UCIALMKvObZNtJ6AmdCLP7Lg',
  CNBCtelevision: 'UCvJJ_dzjViJCoLf5uKUTwoA',
  YahooFinance: 'UCEAZeUIeJs0IjQiqTCdVSIg',
  FoxBusiness: 'UCF9IOB2TExg3QIBupFtBDxg',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const handle = req.query.handle as string
  const channelId = CHANNEL_IDS[handle]
  if (!handle || !channelId) {
    return res.status(400).json({ error: 'Invalid handle' })
  }

  try {
    const { data } = await cached(`youtube-live:${handle}`, 300_000, async () => {
      const r = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      })

      if (!r.ok) return { videoId: null, handle }

      const html = await r.text()

      // Scope to videoDetails block — only return videoId when isLive:true is in the same block
      let videoId: string | null = null
      const detailsIdx = html.indexOf('"videoDetails"')
      if (detailsIdx !== -1) {
        const block = html.substring(detailsIdx, detailsIdx + 5000)
        const vidMatch = block.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
        const liveMatch = block.match(/"isLive"\s*:\s*true/)
        if (vidMatch && liveMatch) {
          videoId = vidMatch[1]
        }
      }

      return { videoId, handle }
    })

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch live stream' })
  }
}
