export function relTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export function fmt(n: number, digits = 2): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function fmtVol(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

export function fmtBig(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K'
  return '$' + n.toLocaleString()
}

export function tabCls(active: boolean): string {
  return `text-[10px] uppercase tracking-wider px-2 py-1 font-medium transition-colors ${
    active ? 'text-foreground border-b border-foreground' : 'text-muted-foreground hover:text-foreground'
  }`
}

export function tabClsPill(active: boolean): string {
  return `text-[10px] uppercase tracking-wider px-1.5 h-4 rounded-sm font-medium ${
    active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
  }`
}

export function changeColor(val: number): string {
  return val >= 0 ? 'text-emerald-400' : 'text-red-400'
}

export function changeBg(val: number): string {
  return val >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
}
