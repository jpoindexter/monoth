import { ModeToggle } from '@/components/mode-toggle'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function isMarketOpen(): boolean {
  const now = new Date()
  const day = now.getDay()
  if (day === 0 || day === 6) return false
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const h = et.getHours()
  const m = et.getMinutes()
  const mins = h * 60 + m
  return mins >= 9 * 60 + 30 && mins < 16 * 60
}

export function TopBar() {
  const open = isMarketOpen()
  return (
    <header className="h-12 border-b bg-background flex items-center px-4 gap-4 shrink-0">
      <span className="font-bold text-lg">Monoth</span>
      <div className="flex-1 flex justify-center">
        <Badge variant={open ? 'default' : 'secondary'}>
          {open ? 'Markets Open' : 'Markets Closed'}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">M</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
