export async function fetchCorrelationEvents() {
  const res = await fetch('/api/correlation/events')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchCorrelationMatrix() {
  const res = await fetch('/api/correlation/matrix')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
