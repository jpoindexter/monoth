import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '../_cors.js'
import { cached } from '../_cache.js'

// Channel IDs for live stream resolution
const CHANNEL_IDS: Record<string, string> = {
  BloombergTV:     'UCIALMKvObZNtJ6AmdCLP7Lg',
  CNBCtelevision:  'UCvJJ_dzjViJCoLf5uKUTwoA',
  FoxBusiness:     'UCCXoCcu9Rp7NPbTzIvogpZg',
  YahooFinance:    'UCEAZeUIeJs0IjQiqTCdVSIg',
  MSNBC:           'UCaXkIU1QidjPwiAYu6GcHjg',
  CNN:             'UCupvZG-5ko_eiXAupbDfxWw',
  BBCNews:         'UC16niRr50-MSBwiO3YDb3RA',
  AlJazeeraEnglish:'UCNye-wNBqNL5ZzHSJj3l8Bg',
  SkyNews:         'UCoMdktPbSTixAyNGwb-UYkQ',
  ABCNews:         'UCBi2mrWuNuyYy4gbM6fU18Q',
  Reuters:         'UChqUTb7kYRX8-EiaN3XFrSQ',
  NTDNews:         'UCjz-4y6ts-VF2KSQX-jsnVg',
  Newsmax:         'UCaDCI0bxPZ_ZHdtx9LXOxRw',
  OANN:            'UCNbIDJNNgaRrXOD7VllIMRQ',
  CNBCi:           'UCo7a6riBFJ3tkeHjvkXVOGojBQ',
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

      // YouTube's /channel/{id}/live page no longer uses a videoDetails block with isLive flag.
      // Strategy 1: currentVideoEndpoint (set when channel is actively live)
      // Strategy 2: first richItemRenderer / videoRenderer on the /live page
      // Both return the live stream video ID reliably.
      let videoId: string | null = null

      const currentEndpoint = html.match(/"currentVideoEndpoint"\s*:\s*\{[^}]*"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/)
      if (currentEndpoint) {
        videoId = currentEndpoint[1]
      } else {
        const richItem = html.match(/"(?:richItemRenderer|videoRenderer)"[^]*?"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/)
        if (richItem) videoId = richItem[1]
      }

      return { videoId, handle }
    })

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch live stream' })
  }
}
