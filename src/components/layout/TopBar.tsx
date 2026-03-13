import { useState } from 'react'
import { ModeToggle } from '@/components/mode-toggle'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AuthModal } from '@/components/auth/AuthModal'
import { useUserStore } from '@/stores/user-store'
import { supabase } from '@/lib/supabase'

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
  const [authOpen, setAuthOpen] = useState(false)
  const authenticated = useUserStore((s) => s.authenticated)
  const email = useUserStore((s) => s.email)

  const initials = email ? email[0]?.toUpperCase() ?? 'M' : 'M'

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

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
        {authenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate max-w-48">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAuthOpen(true)}>
            Sign In
          </Button>
        )}
      </div>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  )
}
