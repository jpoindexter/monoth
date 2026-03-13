export interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  published: number
  category: string
  sentiment?: number
  relatedSymbols?: string[]
}

export interface FeedConfig {
  name: string
  url: string
  category: string
}
