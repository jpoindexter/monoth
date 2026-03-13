import type { NewsItem } from '@/types'

export async function fetchNews(category: string, region = 'global'): Promise<NewsItem[]> {
  const params = new URLSearchParams({ category })
  if (region !== 'global') params.set('region', region)
  const res = await fetch(`/api/news/rss?${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
