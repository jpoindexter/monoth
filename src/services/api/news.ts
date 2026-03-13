import type { NewsItem } from '@/types'

export async function fetchNews(category: string): Promise<NewsItem[]> {
  const res = await fetch(`/api/news/rss?category=${encodeURIComponent(category)}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
