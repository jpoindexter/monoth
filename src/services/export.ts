function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const first = data[0]!
  const headers = Object.keys(first)
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h]
      const str = val == null ? '' : String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str
    }).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

export function exportToJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2)
  triggerDownload(new Blob([json], { type: 'application/json' }), filename)
}
