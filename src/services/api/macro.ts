export interface FredSeries {
  seriesId: string
  name: string
  value: number
  previous: number
  date: string
  change: number
}

export async function fetchEconomicCalendar() {
  const res = await fetch('/api/macro/calendar')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchFredData(series?: string[]): Promise<FredSeries[]> {
  const params = series ? `?series=${series.join(',')}` : ''
  const res = await fetch(`/api/macro/fred${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
