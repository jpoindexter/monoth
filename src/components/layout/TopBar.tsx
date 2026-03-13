import { useState } from 'react'
import { motion } from 'motion/react'
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
    <motion.header
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-8 border-b border-border/60 bg-white dark:bg-[#0a0a0a] flex items-center px-3 shrink-0">
      <span className="font-bold text-[11px] tracking-[2px] uppercase text-foreground">Monoth</span>
      <div className="ml-3 flex items-center gap-1">
        {open ? (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"
          />
        ) : (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
        )}
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
          {open ? 'Live' : 'Closed'}
        </span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        {authenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-5 w-5 cursor-pointer">
                <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal truncate max-w-48">
                {email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-[11px]">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" variant="ghost" className="h-5 text-[10px] px-2" onClick={() => setAuthOpen(true)}>
            Sign In
          </Button>
        )}
      </div>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </motion.header>
  )
}
