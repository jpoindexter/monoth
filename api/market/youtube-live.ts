import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return

  const handle = req.query.handle as string
  if (!handle) {
    return res.status(400).json({ error: 'Missing handle' })
  }

  try {
    const { data } = await cached(`youtube-live:${handle}`, 300_000, async () => {
      const r = await fetch(`https://www.youtube.com/@${handle}/live`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      })

      if (!r.ok) return { videoId: null, handle }

      const html = await r.text()
      let videoId: string | null = null

      // Strategy 1: liveStreamabilityRenderer — most reliable live indicator
      const liveStream = html.match(/"liveStreamabilityRenderer"\s*:\s*\{"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/)
      if (liveStream) videoId = liveStream[1]

      // Strategy 2: videoDetails with isLive: true
      if (!videoId) {
        const detailsIdx = html.indexOf('"videoDetails"')
        if (detailsIdx !== -1) {
          const block = html.substring(detailsIdx, detailsIdx + 5000)
          const vidMatch = block.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
          const liveMatch = block.match(/"isLive"\s*:\s*true/)
          if (vidMatch && liveMatch) videoId = vidMatch[1]
        }
      }

      // Strategy 3: videoDetails with lengthSeconds=0 (live streams report 0 length)
      if (!videoId) {
        const details = html.match(/"videoDetails"\s*:\s*\{"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"[^}]*"lengthSeconds"\s*:\s*"0"/)
        if (details) videoId = details[1]
      }

      // Strategy 4: currentVideoEndpoint
      if (!videoId) {
        const endpoint = html.match(/"currentVideoEndpoint"\s*:\s*\{[^}]*"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/)
        if (endpoint) videoId = endpoint[1]
      }

      return { videoId, handle }
    })

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch live stream' })
  }
}
