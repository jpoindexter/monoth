import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Settings, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/theme-context'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { useRegionStore, REGION_LABELS, type Region } from '@/stores/region-store'
import { isMarketOpen } from '@/lib/market-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function TopBar() {
  const open = isMarketOpen()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const region = useRegionStore((s) => s.region)
  const setRegion = useRegionStore((s) => s.setRegion)
  const { theme, setTheme } = useTheme()

  return (
    <motion.header
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-8 border-b border-border/60 bg-white dark:bg-bg-chrome flex items-center px-3 shrink-0">
      <Link to="/" className="font-bold text-[11px] tracking-[2px] uppercase text-foreground hover:opacity-70 transition-opacity">Monoth</Link>
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
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {open ? 'Live' : 'Closed'}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-2 flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground font-medium">
            {REGION_LABELS[region]}
            <svg width="6" height="6" viewBox="0 0 6 6" className="ml-0.5 opacity-50"><path d="M0.5 1.5L3 4L5.5 1.5" stroke="currentColor" strokeWidth="1" fill="none"/></svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
            <DropdownMenuItem
              key={r}
              onClick={() => setRegion(r)}
              className={`text-[11px] ${region === r ? 'font-medium' : ''}`}
            >
              {region === r && <span className="mr-1">✓</span>}
              {REGION_LABELS[r]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <kbd className="hidden sm:inline text-[9px] text-muted-foreground/60 bg-muted/50 px-1 py-0.5 rounded font-mono">
          /
        </kbd>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
          title={`Theme: ${theme} (D to cycle)`}
        >
          {theme === 'dark' && <Moon className="w-3 h-3" />}
          {theme === 'light' && <Sun className="w-3 h-3" />}
          {theme === 'system' && <Monitor className="w-3 h-3" />}
        </button>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}
          className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors font-mono text-[10px]"
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </motion.header>
  )
}
